import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type { UpdateProfileInput } from "./profile.schema";

const getMyProfile = async (userId: string) => {
  const profile = await db.orm.public.UserProfile.where({
    userId,
  }).first();

  if (!profile) {
    throw new AppError("Profile not found", httpStatus.NOT_FOUND);
  }

  return profile;
};

const upsertMyProfile = async (userId: string, data: UpdateProfileInput) => {
  const existingProfile = await db.orm.public.UserProfile.where({
    userId,
  }).first();

  if (existingProfile) {
    const updateData = {
      ...(data.phone !== undefined && {
        phone: data.phone,
      }),
      ...(data.dateOfBirth !== undefined && {
        dateOfBirth: data.dateOfBirth,
      }),
      ...(data.bio !== undefined && {
        bio: data.bio,
      }),
    };

    return db.orm.public.UserProfile.where({
      userId,
    }).update(updateData);
  }

  return db.orm.public.UserProfile.create({
    userId,
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
};

const deleteMyProfile = async (userId: string) => {
  const profile = await db.orm.public.UserProfile.where({
    userId,
  }).first();

  if (!profile) {
    throw new AppError("Profile not found", httpStatus.NOT_FOUND);
  }

  await db.orm.public.UserProfile.where({
    userId,
  }).delete();

  return null;
};

export const ProfileService = {
  getMyProfile,
  upsertMyProfile,
  deleteMyProfile,
};
