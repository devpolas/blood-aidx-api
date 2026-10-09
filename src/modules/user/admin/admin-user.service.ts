import httpStatus from "http-status";

import type {
  AdminUpdateUserInput,
  AdminUpdateUserRoleInput,
  AdminUserQueryInput,
  BanUserInput,
} from "./admin-user.schema";
import { db } from "../../../lib/db";
import { AppError } from "../../../utils/appError";

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

// User

const getUserById = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

// User List

const applyUserFilters = (query: AdminUserQueryInput) => {
  let userQuery = db.orm.public.User.select(...userSelect);

  const search = query.search;

  if (search) {
    userQuery = userQuery.where(
      (user) =>
        user.name.ilike(`%${search}%`) || user.email.ilike(`%${search}%`),
    );
  }

  if (query.role) {
    userQuery = userQuery.where({
      role: query.role,
    });
  }

  if (query.banned !== undefined) {
    userQuery = userQuery.where({
      banned: query.banned,
    });
  }

  if (query.emailVerified !== undefined) {
    userQuery = userQuery.where({
      emailVerified: query.emailVerified,
    });
  }

  const createdAtFrom = query.createdAtFrom;

  if (createdAtFrom) {
    userQuery = userQuery.where((user) => user.createdAt.gte(createdAtFrom));
  }

  const createdAtTo = query.createdAtTo;

  if (createdAtTo) {
    userQuery = userQuery.where((user) => user.createdAt.lte(createdAtTo));
  }

  return userQuery;
};

const getUserList = async (query: AdminUserQueryInput) => {
  const filteredQuery = applyUserFilters(query);

  const totalResult = await filteredQuery.aggregate((aggregate) => ({
    total: aggregate.count(),
  }));

  const total = totalResult.total;
  const offset = (query.page - 1) * query.limit;
  const ascending = query.sortOrder === "asc";

  let sortedQuery;

  switch (query.sortBy) {
    case "updatedAt":
      sortedQuery = filteredQuery.orderBy((user) =>
        ascending ? user.updatedAt.asc() : user.updatedAt.desc(),
      );
      break;

    case "name":
      sortedQuery = filteredQuery.orderBy((user) =>
        ascending ? user.name.asc() : user.name.desc(),
      );
      break;

    case "email":
      sortedQuery = filteredQuery.orderBy((user) =>
        ascending ? user.email.asc() : user.email.desc(),
      );
      break;

    case "role":
      sortedQuery = filteredQuery.orderBy((user) =>
        ascending ? user.role.asc() : user.role.desc(),
      );
      break;

    case "createdAt":
    default:
      sortedQuery = filteredQuery.orderBy((user) =>
        ascending ? user.createdAt.asc() : user.createdAt.desc(),
      );
      break;
  }

  const users = await sortedQuery.offset(offset).limit(query.limit).all();

  const totalPage = Math.ceil(total / query.limit);

  return {
    users,
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

const getUsers = async (query: AdminUserQueryInput) => {
  return getUserList(query);
};

// Get User

const getUser = async (userId: string) => {
  return getUserById(userId);
};

// Update User

const updateUser = async (userId: string, data: AdminUpdateUserInput) => {
  await getUserById(userId);

  return db.orm.public.User.where({
    id: userId,
  }).update({
    ...(data.name !== undefined && {
      name: data.name,
    }),

    ...(data.image !== undefined && {
      image: data.image,
    }),

    ...(data.gender !== undefined && {
      gender: data.gender,
    }),
  });
};

// Change Role

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

// Ban

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

// Unban

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

// Delete

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
