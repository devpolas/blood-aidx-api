import httpStatus from "http-status";
import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type { UpdateUserInput } from "./user.schema";

//get me

export const getMe = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

// update me

export const updateMe = async (userId: string, data: UpdateUserInput) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  const updateData = {
    ...(data.name !== undefined && {
      name: data.name,
    }),

    ...(data.image !== undefined && {
      image: data.image,
    }),

    ...(data.gender !== undefined && {
      gender: data.gender,
    }),
  };

  const updatedUser = await db.orm.public.User.where({
    id: userId,
  }).update(updateData);

  return updatedUser;
};

// delete me

export const deleteMe = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  const ownedOrganization = await db.orm.public.Organization.where({
    ownerId: userId,
  }).first();

  if (ownedOrganization) {
    throw new AppError(
      "You cannot delete your account while you own an organization.",
      httpStatus.CONFLICT,
    );
  }

  await db.transaction(async (tx) => {
    await tx.orm.public.Session.where({
      userId,
    }).delete();

    await tx.orm.public.User.where({
      id: userId,
    }).delete();
  });

  return {
    message: "Account deleted successfully",
  };
};
