import httpStatus from "http-status";

import type { UpdateDonorProfileInput } from "./donor.schema";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

// Types

type ActorRole =
  | "donor"
  | "recipient"
  | "volunteer"
  | "hospital"
  | "blood_bank"
  | "moderator"
  | "admin";

// Actor

const getActor = async (userId: string) => {
  const actor = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!actor) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return actor;
};

// Role Helpers

const isDonorRole = (role: ActorRole) => {
  return role === "donor";
};

const isModeratorRole = (role: ActorRole) => {
  return role === "moderator" || role === "admin";
};

const isAdminRole = (role: ActorRole) => {
  return role === "admin";
};

// Require Donor

const requireDonor = async (userId: string) => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  if (!isDonorRole(role)) {
    throw new AppError(
      "Only donors can manage their donor profile",
      httpStatus.FORBIDDEN,
    );
  }

  return actor;
};

// Require Moderator / Admin

const requireModerator = async (userId: string) => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  if (!isModeratorRole(role)) {
    throw new AppError(
      "Only moderators or administrators can manage donor profiles",
      httpStatus.FORBIDDEN,
    );
  }

  return {
    actor,
    role,
  };
};

// Require Admin

const requireAdmin = async (userId: string) => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  if (!isAdminRole(role)) {
    throw new AppError(
      "Only administrators can perform this action",
      httpStatus.FORBIDDEN,
    );
  }

  return actor;
};

// Get Donor By User ID

const getDonorByUserId = async (userId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (!donor) {
    throw new AppError("Donor profile not found", httpStatus.NOT_FOUND);
  }

  return donor;
};

// Get Donor By ID

const getDonorById = async (donorId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    id: donorId,
  }).first();

  if (!donor) {
    throw new AppError("Donor not found", httpStatus.NOT_FOUND);
  }

  return donor;
};

// Build Donor Update Data

const buildDonorUpdateData = (data: UpdateDonorProfileInput) => ({
  ...(data.bloodGroup !== undefined && {
    bloodGroup: data.bloodGroup,
  }),

  ...(data.availability !== undefined && {
    availability: data.availability,
  }),

  ...(data.lastDonationAt !== undefined && {
    lastDonationAt: data.lastDonationAt,
  }),
});

// Get My Donor Profile

const getMyDonorProfile = async (userId: string) => {
  await requireDonor(userId);

  return getDonorByUserId(userId);
};

// Create / Update My Donor Profile

const upsertMyDonorProfile = async (
  userId: string,
  data: UpdateDonorProfileInput,
) => {
  await requireDonor(userId);

  const existingDonor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  // Update

  if (existingDonor) {
    const updateData = buildDonorUpdateData(data);

    return db.orm.public.DonorProfile.where({
      userId,
    }).update(updateData);
  }

  // Create

  if (data.bloodGroup === undefined) {
    throw new AppError(
      "Blood group is required to create a donor profile",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.orm.public.DonorProfile.create({
    userId,
    bloodGroup: data.bloodGroup,

    ...(data.availability !== undefined && {
      availability: data.availability,
    }),

    ...(data.lastDonationAt !== undefined && {
      lastDonationAt: data.lastDonationAt,
    }),
  });
};

// Delete My Donor Profile

const deleteMyDonorProfile = async (userId: string) => {
  await requireDonor(userId);

  await getDonorByUserId(userId);

  await db.orm.public.DonorProfile.where({
    userId,
  }).delete();

  return null;
};

// Moderator / Admin: Update Donor Profile

const updateDonorProfileById = async (
  userId: string,
  donorId: string,
  data: UpdateDonorProfileInput,
) => {
  await requireModerator(userId);

  await getDonorById(donorId);

  const updateData = buildDonorUpdateData(data);

  return db.orm.public.DonorProfile.where({
    id: donorId,
  }).update(updateData);
};

// Admin: Delete Donor Profile

const deleteDonorProfileById = async (userId: string, donorId: string) => {
  await requireAdmin(userId);

  await getDonorById(donorId);

  await db.orm.public.DonorProfile.where({
    id: donorId,
  }).delete();

  return null;
};

// Get All Donors

const getDonors = async (userId: string) => {
  await requireModerator(userId);

  return db.orm.public.DonorProfile.all();
};

// Export

export const DonorService = {
  getMyDonorProfile,
  upsertMyDonorProfile,
  deleteMyDonorProfile,
  getDonorById,
  getDonors,
  updateDonorProfileById,
  deleteDonorProfileById,
};
