import crypto from "node:crypto";
import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "./milestone.schema";

// Types

type GlobalRole =
  | "donor"
  | "recipient"
  | "volunteer"
  | "hospital"
  | "blood_bank"
  | "moderator"
  | "admin";

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Helpers

const getUserById = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

const requireDonor = async (userId: string) => {
  const user = await getUserById(userId);

  if ((user.role as GlobalRole) !== "donor") {
    throw new AppError("Donor access required", httpStatus.FORBIDDEN);
  }

  return user;
};

const requireModerator = async (userId: string) => {
  const user = await getUserById(userId);

  const role = user.role as GlobalRole;

  if (role !== "moderator" && role !== "admin") {
    throw new AppError(
      "Moderator or admin access required",
      httpStatus.FORBIDDEN,
    );
  }

  return user;
};

const requireAdmin = async (userId: string) => {
  const user = await getUserById(userId);

  if ((user.role as GlobalRole) !== "admin") {
    throw new AppError("Admin access required", httpStatus.FORBIDDEN);
  }

  return user;
};

const getMilestoneById = async (milestoneId: string) => {
  const milestone = await db.orm.public.DonationMilestone.where({
    id: milestoneId,
  }).first();

  if (!milestone) {
    throw new AppError("Milestone not found", httpStatus.NOT_FOUND);
  }

  return milestone;
};

const generateCertificateNo = (): string => {
  return `MILESTONE-${new Date().getFullYear()}-${crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)
    .toUpperCase()}`;
};

const generateVerificationCode = (): string => {
  return crypto.randomUUID().replace(/-/g, "").toUpperCase();
};

// Milestone CRUD

const createMilestone = async (userId: string, input: CreateMilestoneInput) => {
  await requireAdmin(userId);

  const existing = await db.orm.public.DonationMilestone.where({
    donationCount: input.donationCount,
  }).first();

  if (existing) {
    throw new AppError(
      "A milestone with this donation count already exists",
      httpStatus.CONFLICT,
    );
  }

  return db.orm.public.DonationMilestone.create({
    name: input.name,

    description: input.description,

    donationCount: input.donationCount,

    ...(input.badgeUrl !== undefined && {
      badgeUrl: input.badgeUrl,
    }),

    createdAt: new Date().toISOString(),

    updatedAt: Temporal.Now.instant(),
  });
};

const getMilestones = async () => {
  const milestones = await db.orm.public.DonationMilestone.all();

  return milestones.toSorted((a, b) => a.donationCount - b.donationCount);
};

const getMilestone = async (milestoneId: string) => {
  return getMilestoneById(milestoneId);
};

const updateMilestone = async (
  userId: string,
  milestoneId: string,
  input: UpdateMilestoneInput,
) => {
  await requireAdmin(userId);

  const milestone = await getMilestoneById(milestoneId);

  // Prevent changing the threshold after the milestone
  // has already been awarded.

  if (
    input.donationCount !== undefined &&
    input.donationCount !== milestone.donationCount
  ) {
    const awarded = await db.orm.public.UserMilestone.where({
      milestoneId,
    }).first();

    if (awarded) {
      throw new AppError(
        "Donation threshold cannot be changed after this milestone has been awarded",
        httpStatus.BAD_REQUEST,
      );
    }

    const existing = await db.orm.public.DonationMilestone.where({
      donationCount: input.donationCount,
    }).first();

    if (existing && existing.id !== milestoneId) {
      throw new AppError(
        "A milestone with this donation count already exists",
        httpStatus.CONFLICT,
      );
    }
  }

  return db.orm.public.DonationMilestone.where({
    id: milestoneId,
  }).update({
    ...(input.name !== undefined && {
      name: input.name,
    }),

    ...(input.description !== undefined && {
      description: input.description,
    }),

    ...(input.donationCount !== undefined && {
      donationCount: input.donationCount,
    }),

    ...(input.badgeUrl !== undefined && {
      badgeUrl: input.badgeUrl,
    }),

    updatedAt: Temporal.Now.instant(),
  });
};

const deleteMilestone = async (userId: string, milestoneId: string) => {
  await requireAdmin(userId);

  await getMilestoneById(milestoneId);

  const awarded = await db.orm.public.UserMilestone.where({
    milestoneId,
  }).first();

  if (awarded) {
    throw new AppError(
      "Cannot delete a milestone that has already been awarded",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.orm.public.DonationMilestone.where({
    id: milestoneId,
  }).delete();
};

// User Milestones

const getMyMilestones = async (userId: string) => {
  await requireDonor(userId);

  return db.orm.public.UserMilestone.where({
    userId,
  }).all();
};

const getUserMilestones = async (actorUserId: string, targetUserId: string) => {
  const actor = await requireModerator(actorUserId);

  const isOwner = actor.id === targetUserId;

  const isModerator = actor.role === "moderator" || actor.role === "admin";

  if (!isOwner && !isModerator) {
    throw new AppError(
      "You do not have permission to view these milestones",
      httpStatus.FORBIDDEN,
    );
  }

  await getUserById(targetUserId);

  return db.orm.public.UserMilestone.where({
    userId: targetUserId,
  }).all();
};

// Automatic Milestone Processing

const processDonationMilestones = async (
  tx: TransactionClient,
  userId: string,
  donationCount: number,
  donorName: string,
) => {
  const milestones = await tx.orm.public.DonationMilestone.all();

  if (milestones.length === 0) {
    return [];
  }

  const awardedMilestones = await tx.orm.public.UserMilestone.where({
    userId,
  }).all();

  const awardedMilestoneIds = new Set(
    awardedMilestones.map(({ milestoneId }) => milestoneId),
  );

  const eligibleMilestones = milestones
    .filter(
      (milestone) =>
        milestone.donationCount <= donationCount &&
        !awardedMilestoneIds.has(milestone.id),
    )
    .toSorted((a, b) => a.donationCount - b.donationCount);

  if (eligibleMilestones.length === 0) {
    return [];
  }

  const newlyAwarded = await Promise.all(
    eligibleMilestones.map(async (milestone) => {
      const now = new Date().toISOString();

      // 1. Award milestone
      const userMilestone = await tx.orm.public.UserMilestone.create({
        userId,
        milestoneId: milestone.id,
        achievedAt: now,
      });

      // 2. Create certificate
      const certificate = await tx.orm.public.MilestoneCertificate.create({
        userMilestoneId: userMilestone.id,
        certificateNo: generateCertificateNo(),
        verificationCode: generateVerificationCode(),
        donorName,
        donationCount,
        achievedAt: now,
      });

      // 3. Create notification
      const notification = await tx.orm.public.Notification.create({
        userId,
        type: "milestone",
        title: "Milestone Achieved!",
        message: `Congratulations! You have reached the "${milestone.name}" milestone.`,
        data: {
          milestoneId: milestone.id,
          userMilestoneId: userMilestone.id,
          certificateId: certificate.id,
        },
        createdAt: now,
        updatedAt: Temporal.Now.instant(),
      });

      return {
        milestone: userMilestone,
        certificate,
        notification,
      };
    }),
  );

  return newlyAwarded;
};

// Export

export const MilestoneService = {
  createMilestone,
  getMilestones,
  getMilestone,
  updateMilestone,
  deleteMilestone,
  getMyMilestones,
  getUserMilestones,
  processDonationMilestones,
};
