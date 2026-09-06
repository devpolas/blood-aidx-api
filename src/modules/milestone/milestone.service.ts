import crypto from "node:crypto";
import { db } from "../../lib/db";
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "./milestone.schema";

// Helpers

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

const createMilestone = async (input: CreateMilestoneInput) => {
  const existing = await db.orm.public.DonationMilestone.where({
    donationCount: input.donationCount,
  }).first();

  if (existing) {
    throw new Error("A milestone with this donation count already exists");
  }

  return db.orm.public.DonationMilestone.create({
    name: input.name,
    description: input.description,
    donationCount: input.donationCount,
    badgeUrl: input.badgeUrl ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: Temporal.Now.instant(),
  });
};

const getMilestones = async () => {
  const milestones = await db.orm.public.DonationMilestone.all();

  return milestones.toSorted((a, b) => a.donationCount - b.donationCount);
};

const getMilestoneById = async (milestoneId: string) => {
  const milestone = await db.orm.public.DonationMilestone.where({
    id: milestoneId,
  }).first();

  if (!milestone) {
    throw new Error("Milestone not found");
  }

  return milestone;
};

const updateMilestone = async (
  milestoneId: string,
  input: UpdateMilestoneInput,
) => {
  const milestone = await getMilestoneById(milestoneId);

  // Prevent duplicate donation thresholds
  if (
    input.donationCount !== undefined &&
    input.donationCount !== milestone.donationCount
  ) {
    const existing = await db.orm.public.DonationMilestone.where({
      donationCount: input.donationCount,
    }).first();

    if (existing && existing.id !== milestoneId) {
      throw new Error("A milestone with this donation count already exists");
    }
  }

  const updateData = {
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
  };

  return db.orm.public.DonationMilestone.where({
    id: milestoneId,
  }).update(updateData);
};

const deleteMilestone = async (milestoneId: string) => {
  await getMilestoneById(milestoneId);

  const userMilestones = await db.orm.public.UserMilestone.where({
    milestoneId,
  }).all();

  if (userMilestones.length > 0) {
    throw new Error("Cannot delete a milestone that has already been awarded");
  }

  return db.orm.public.DonationMilestone.where({
    id: milestoneId,
  }).delete();
};

// User Milestones

const getMyMilestones = async (userId: string) => {
  const donorProfile = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (!donorProfile) {
    throw new Error("Donor profile not found");
  }

  return db.orm.public.UserMilestone.where({
    userId,
  }).all();
};

const getUserMilestones = async (userId: string) => {
  return db.orm.public.UserMilestone.where({
    userId,
  }).all();
};

// Automatic Milestone Processing

const processDonationMilestones = async (userId: string) => {
  const [donorProfile, user] = await Promise.all([
    db.orm.public.DonorProfile.where({ userId }).first(),

    db.orm.public.User.where({ id: userId }).first(),
  ]);

  if (!donorProfile) {
    throw new Error("Donor profile not found");
  }

  if (!user) {
    throw new Error("User not found");
  }

  const donationCount = donorProfile.totalDonations;

  const [milestones, awardedMilestones] = await Promise.all([
    db.orm.public.DonationMilestone.all(),

    db.orm.public.UserMilestone.where({ userId }).all(),
  ]);

  const awardedMilestoneIds = new Set(
    awardedMilestones.map(({ milestoneId }) => milestoneId),
  );

  const eligibleMilestones = milestones.filter(
    (milestone) =>
      milestone.donationCount <= donationCount &&
      !awardedMilestoneIds.has(milestone.id),
  );

  if (eligibleMilestones.length === 0) {
    return [];
  }

  const newlyAwarded = await Promise.all(
    eligibleMilestones.map((milestone) =>
      db.transaction(async (tx) => {
        const now = new Date().toISOString();

        const userMilestone = await tx.orm.public.UserMilestone.create({
          userId,
          milestoneId: milestone.id,
          achievedAt: now,
        });

        const certificate = await tx.orm.public.MilestoneCertificate.create({
          userMilestoneId: userMilestone.id,
          certificateNo: generateCertificateNo(),
          verificationCode: generateVerificationCode(),
          donorName: user.name,
          donationCount,
          achievedAt: now,
        });

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
    ),
  );

  return newlyAwarded;
};

// Export

export const MilestoneService = {
  createMilestone,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
  getMyMilestones,
  getUserMilestones,
  processDonationMilestones,
};
