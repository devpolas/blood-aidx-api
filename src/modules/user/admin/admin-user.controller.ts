import type { Request, Response } from "express";

import httpStatus from "http-status";

import {
  AdminUpdateUserRoleSchema,
  AdminUpdateUserSchema,
  AdminUserQuerySchema,
  BanUserSchema,
} from "./admin-user.schema";
import { AdminUserService } from "./admin-user.service";
import { requireAuth } from "../../../middleware/auth.middleware";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";

// Users

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const query = AdminUserQuerySchema.parse(req.query);

  const result = await AdminUserService.getUsers(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminUserService.getUser(req.params.userId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

// Update User

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const data = AdminUpdateUserSchema.parse(req.body);

  const result = await AdminUserService.updateUser(
    req.params.userId as string,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

// Role

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const data = AdminUpdateUserRoleSchema.parse(req.body);

  const result = await AdminUserService.changeUserRole(
    user.id,
    req.params.userId as string,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role updated successfully",
    data: result,
  });
});

// Ban

const banUser = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const data = BanUserSchema.parse(req.body);

  const result = await AdminUserService.banUser(
    user.id,
    req.params.userId as string,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User banned successfully",
    data: result,
  });
});

// Unban

const unbanUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminUserService.unbanUser(req.params.userId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User unbanned successfully",
    data: result,
  });
});

// Delete

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await AdminUserService.deleteUser(
    user.id,
    req.params.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const AdminUserController = {
  getUsers,
  getUser,
  updateUser,
  changeUserRole,
  banUser,
  unbanUser,
  deleteUser,
};
