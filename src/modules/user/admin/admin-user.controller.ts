import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../../middleware/auth.middleware";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";

import {
  AdminUpdateUserRoleSchema,
  AdminUpdateUserSchema,
  AdminUserQuerySchema,
  BanUserSchema,
} from "./admin-user.schema";

import { AdminUserService } from "./admin-user.service";

export const AdminUserController = {
  // Users

  getUsers: catchAsync(async (req: Request, res: Response) => {
    const query = AdminUserQuerySchema.parse(req.query);

    const result = await AdminUserService.getUsers(query);

    sendResponse(res, {
      success: true,
      message: "Users retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        users: result.users,
      },
      meta: result.meta,
    });
  }),

  getUser: catchAsync(async (req: Request, res: Response) => {
    const user = await AdminUserService.getUser(req.params.userId as string);

    sendResponse(res, {
      success: true,
      message: "User retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        user,
      },
    });
  }),

  // Update User

  updateUser: catchAsync(async (req: Request, res: Response) => {
    const data = AdminUpdateUserSchema.parse(req.body);

    const user = await AdminUserService.updateUser(
      req.params.userId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "User updated successfully",
      statusCode: httpStatus.OK,
      data: {
        user,
      },
    });
  }),

  // Role

  changeUserRole: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = AdminUpdateUserRoleSchema.parse(req.body);

    const updatedUser = await AdminUserService.changeUserRole(
      user.id,
      req.params.userId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "User role updated successfully",
      statusCode: httpStatus.OK,
      data: {
        user: updatedUser,
      },
    });
  }),

  // Ban

  banUser: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = BanUserSchema.parse(req.body);

    const updatedUser = await AdminUserService.banUser(
      user.id,
      req.params.userId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "User banned successfully",
      statusCode: httpStatus.OK,
      data: {
        user: updatedUser,
      },
    });
  }),

  // Unban

  unbanUser: catchAsync(async (req: Request, res: Response) => {
    const user = await AdminUserService.unbanUser(req.params.userId as string);

    sendResponse(res, {
      success: true,
      message: "User unbanned successfully",
      statusCode: httpStatus.OK,
      data: {
        user,
      },
    });
  }),

  // Delete

  deleteUser: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const result = await AdminUserService.deleteUser(
      user.id,
      req.params.userId as string,
    );

    sendResponse(res, {
      success: true,
      message: result.message,
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
