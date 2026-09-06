import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type { UpdateProfileInput } from "./profile.schema";

type ActorRole =
  | "donor"
  | "recipient"
  | "volunteer"
  | "hospital"
  | "blood_bank"
  | "moderator"
  | "admin";

// Helpers

const getActor = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

const isModeratorRole = (role: ActorRole) =>
  role === "moderator" || role === "admin";

const isAdminRole = (role: ActorRole) => role === "admin";

const requireModerator = async (userId: string) => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  if (!isModeratorRole(role)) {
    throw new AppError(
      "Moderator or admin access required",
      httpStatus.FORBIDDEN,
    );
  }

  return actor;
};

const requireAdmin = async (userId: string) => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  if (!isAdminRole(role)) {
    throw new AppError("Admin access required", httpStatus.FORBIDDEN);
  }

  return actor;
};

const getProfileByUserId = async (profileUserId: string) => {
  const profile = await db.orm.public.UserProfile.where({
    userId: profileUserId,
  }).first();

  if (!profile) {
    throw new AppError("Profile not found", httpStatus.NOT_FOUND);
  }

  return profile;
};

const buildProfileUpdateData = (data: UpdateProfileInput) => ({
  ...(data.phone !== undefined && {
    phone: data.phone,
  }),

  ...(data.dateOfBirth !== undefined && {
    dateOfBirth: data.dateOfBirth,
  }),

  ...(data.bio !== undefined && {
    bio: data.bio,
  }),
});

// My Profile

const getMyProfile = async (userId: string) => {
  return getProfileByUserId(userId);
};

const upsertMyProfile = async (userId: string, data: UpdateProfileInput) => {
  const existingProfile = await db.orm.public.UserProfile.where({
    userId,
  }).first();

  if (existingProfile) {
    return db.orm.public.UserProfile.where({
      userId,
    }).update(buildProfileUpdateData(data));
  }

  return db.orm.public.UserProfile.create({
    userId,
    ...buildProfileUpdateData(data),
  });
};

const deleteMyProfile = async (userId: string) => {
  await getProfileByUserId(userId);

  await db.orm.public.UserProfile.where({
    userId,
  }).delete();

  return null;
};

// Moderator / Admin Profile Management

const getProfileByUserIdForModerator = async (
  userId: string,
  profileUserId: string,
) => {
  await requireModerator(userId);

  return getProfileByUserId(profileUserId);
};

const updateProfileByUserId = async (
  userId: string,
  profileUserId: string,
  data: UpdateProfileInput,
) => {
  await requireModerator(userId);

  await getProfileByUserId(profileUserId);

  return db.orm.public.UserProfile.where({
    userId: profileUserId,
  }).update(buildProfileUpdateData(data));
};

const deleteProfileByUserId = async (userId: string, profileUserId: string) => {
  await requireAdmin(userId);

  await getProfileByUserId(profileUserId);

  await db.orm.public.UserProfile.where({
    userId: profileUserId,
  }).delete();

  return null;
};

export const ProfileService = {
  getMyProfile,
  upsertMyProfile,
  deleteMyProfile,

  getProfileByUserIdForModerator,
  updateProfileByUserId,
  deleteProfileByUserId,
};
