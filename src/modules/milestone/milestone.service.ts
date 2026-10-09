import crypto from "node:crypto";

import httpStatus from "http-status";

import type {
  CreateMilestoneInput,
  MilestoneQueryInput,
  UpdateMilestoneInput,
  UserMilestoneQueryInput,
} from "./milestone.schema";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

type GlobalRole = "user" | "moderator" | "admin";

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

  if ((user.role as GlobalRole) !== "user") {
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

const generateCertificateNo = () =>
  `MILESTONE-${new Date().getFullYear()}-${crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)
    .toUpperCase()}`;

const generateVerificationCode = () =>
  crypto.randomUUID().replace(/-/g, "").toUpperCase();

// Milestone List
const getMilestoneList = async (query: MilestoneQueryInput) => {
  const milestoneQuery = db.orm.public.DonationMilestone;

  const offset = (query.page - 1) * query.limit;
  const ascending = query.sortOrder === "asc";

  const getSortedMilestones = () => {
    switch (query.sortBy) {
      case "createdAt":
        return milestoneQuery.orderBy((milestone) =>
          ascending ? milestone.createdAt.asc() : milestone.createdAt.desc(),
        );

      case "updatedAt":
        return milestoneQuery.orderBy((milestone) =>
          ascending ? milestone.updatedAt.asc() : milestone.updatedAt.desc(),
        );

      case "name":
        return milestoneQuery.orderBy((milestone) =>
          ascending ? milestone.name.asc() : milestone.name.desc(),
        );

      case "donationCount":
      default:
        return milestoneQuery.orderBy((milestone) =>
          ascending
            ? milestone.donationCount.asc()
            : milestone.donationCount.desc(),
        );
    }
  };

  const [data, countResult] = await Promise.all([
    getSortedMilestones().offset(offset).limit(query.limit).all(),
    milestoneQuery.aggregate((aggregate) => ({
      total: aggregate.count(),
    })),
  ]);

  const total = countResult.total;
  const totalPage = Math.ceil(total / query.limit);

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPage,
      hasNextPage: query.page < totalPage,
      hasPreviousPage: query.page > 1 && totalPage > 0,
    },
  };
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

const getMilestones = async (query: MilestoneQueryInput) => {
  return getMilestoneList(query);
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

const getUserMilestoneList = async (
  userId: string,
  query: UserMilestoneQueryInput,
) => {
  const milestoneQuery = db.orm.public.UserMilestone.where({
    userId,
  });

  const totalResult = await milestoneQuery.aggregate((aggregate) => ({
    total: aggregate.count(),
  }));

  const total = Number(totalResult.total ?? 0);
  const offset = (query.page - 1) * query.limit;

  const sortedQuery = milestoneQuery.orderBy((milestone) =>
    query.sortOrder === "asc"
      ? milestone.achievedAt.asc()
      : milestone.achievedAt.desc(),
  );

  const data = await sortedQuery.offset(offset).limit(query.limit).all();

  const totalPage = Math.ceil(total / query.limit);

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPage,
      hasNextPage: query.page < totalPage,
      hasPreviousPage: query.page > 1,
    },
  };
};

const getMyMilestones = async (
  userId: string,
  query: UserMilestoneQueryInput,
) => {
  await requireDonor(userId);

  return getUserMilestoneList(userId, query);
};

// Moderator / Admin

const getUserMilestones = async (
  actorUserId: string,
  targetUserId: string,
  query: UserMilestoneQueryInput,
) => {
  await requireModerator(actorUserId);
  await getUserById(targetUserId);

  return getUserMilestoneList(targetUserId, query);
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

  return Promise.all(
    eligibleMilestones.map(async (milestone) => {
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
        donorName,
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
  );
};

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
