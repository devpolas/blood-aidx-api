import type { Request, Response } from "express";

import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { AppError } from "../../../utils/appError";

import {
  AdminUpdateUserRoleSchema,
  AdminUpdateUserSchema,
  BanUserSchema,
} from "./admin-user.schema";

import { AdminUserService } from "./admin-user.service";

const requireAdminId = (req: Request): string => {
  if (!req.auth?.user) {
    throw new AppError("Please login first", 401);
  }

  return req.auth.user.id;
};

export const AdminUserController = {
  // Get All Users

  getUsers: catchAsync(async (_req: Request, res: Response) => {
    const users = await AdminUserService.getUsers();

    sendResponse(res, {
      success: true,
      message: "Users retrieved successfully",
      statusCode: 200,
      data: {
        users,
      },
    });
  }),

  // Get User

  getUser: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const user = await AdminUserService.getUser(userId);

    sendResponse(res, {
      success: true,
      message: "User retrieved successfully",
      statusCode: 200,
      data: {
        user,
      },
    });
  }),

  // Update User

  updateUser: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const data = AdminUpdateUserSchema.parse(req.body);

    const user = await AdminUserService.updateUser(userId, data);

    sendResponse(res, {
      success: true,
      message: "User updated successfully",
      statusCode: 200,
      data: {
        user,
      },
    });
  }),

  // Change Role

  changeUserRole: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const data = AdminUpdateUserRoleSchema.parse(req.body);

    const adminId = requireAdminId(req);

    const user = await AdminUserService.changeUserRole(adminId, userId, data);

    sendResponse(res, {
      success: true,
      message: "User role updated successfully",
      statusCode: 200,
      data: {
        user,
      },
    });
  }),

  // Ban User

  banUser: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const data = BanUserSchema.parse(req.body);

    const adminId = requireAdminId(req);

    const user = await AdminUserService.banUser(adminId, userId, data);

    sendResponse(res, {
      success: true,
      message: "User banned successfully",
      statusCode: 200,
      data: {
        user,
      },
    });
  }),

  // Unban User

  unbanUser: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const user = await AdminUserService.unbanUser(userId);

    sendResponse(res, {
      success: true,
      message: "User unbanned successfully",
      statusCode: 200,
      data: {
        user,
      },
    });
  }),

  // Delete User

  deleteUser: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const adminId = requireAdminId(req);

    const result = await AdminUserService.deleteUser(adminId, userId);

    sendResponse(res, {
      success: true,
      message: result.message,
      statusCode: 200,
    });
  }),
};
