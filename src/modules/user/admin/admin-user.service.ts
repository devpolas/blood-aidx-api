import httpStatus from "http-status";

import { db } from "../../../lib/db";
import { AppError } from "../../../utils/appError";

import type {
  AdminUpdateUserInput,
  AdminUpdateUserRoleInput,
  BanUserInput,
} from "./admin-user.schema";

const userSelect = [
  "id",
  "name",
  "email",
  "emailVerified",
  "image",
  "role",
  "gender",
  "banned",
  "banReason",
  "banExpires",
  "createdAt",
  "updatedAt",
] as const;

const getUserById = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

const getUsers = async () => {
  const users = await db.orm.public.User.select(...userSelect).all();

  return users;
};

const getUser = async (userId: string) => {
  return getUserById(userId);
};

const updateUser = async (userId: string, data: AdminUpdateUserInput) => {
  await getUserById(userId);

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

  return db.orm.public.User.where({
    id: userId,
  }).update(updateData);
};

const changeUserRole = async (
  adminId: string,
  userId: string,
  data: AdminUpdateUserRoleInput,
) => {
  if (adminId === userId) {
    throw new AppError("You cannot change your own role", httpStatus.FORBIDDEN);
  }

  const user = await getUserById(userId);

  if (user.role === "admin") {
    throw new AppError(
      "Admin role cannot be changed by this operation",
      httpStatus.FORBIDDEN,
    );
  }

  return db.orm.public.User.where({
    id: userId,
  }).update({
    role: data.role,
  });
};

const banUser = async (adminId: string, userId: string, data: BanUserInput) => {
  if (adminId === userId) {
    throw new AppError("You cannot ban yourself", httpStatus.FORBIDDEN);
  }

  const user = await getUserById(userId);

  if (user.role === "admin") {
    throw new AppError("Admin accounts cannot be banned", httpStatus.FORBIDDEN);
  }

  const updatedUser = await db.orm.public.User.where({
    id: userId,
  }).update({
    banned: true,
    banReason: data.reason,
    banExpires: data.expiresAt ?? null,
  });

  await db.orm.public.Session.where({
    userId,
  }).delete();

  return updatedUser;
};

const unbanUser = async (userId: string) => {
  const user = await getUserById(userId);

  if (!user.banned) {
    throw new AppError("User is not banned", httpStatus.BAD_REQUEST);
  }

  return db.orm.public.User.where({
    id: userId,
  }).update({
    banned: false,
    banReason: null,
    banExpires: null,
  });
};

const deleteUser = async (adminId: string, userId: string) => {
  if (adminId === userId) {
    throw new AppError(
      "You cannot delete your own admin account from this endpoint",
      httpStatus.FORBIDDEN,
    );
  }

  const user = await getUserById(userId);

  if (user.role === "admin") {
    throw new AppError(
      "Admin accounts cannot be deleted from this endpoint",
      httpStatus.FORBIDDEN,
    );
  }

  const ownedOrganization = await db.orm.public.Organization.where({
    ownerId: userId,
  }).first();

  if (ownedOrganization) {
    throw new AppError(
      "User owns an organization. Transfer ownership or remove the organization first.",
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
    message: "User deleted successfully",
  };
};

export const AdminUserService = {
  getUsers,
  getUser,
  updateUser,
  changeUserRole,
  banUser,
  unbanUser,
  deleteUser,
};
