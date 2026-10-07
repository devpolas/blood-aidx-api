import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { deleteMe, getMe, getUser, updateMe } from "./user.service";
import { UpdateUserSchema } from "./user.schema";
import httpStatus from "http-status";

const requireUserId = (req: Request): string => {
  if (!req.auth?.user) {
    throw new Error("Authenticated user is required");
  }

  return req.auth.user.id;
};

export const UserController = {
  getUser: catchAsync(async (req: Request, res: Response) => {
    const result = await getUser(req.params.userId as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User retrieved successfully",
      data: result,
    });
  }),
  // Current User

  getMe: catchAsync(async (req: Request, res: Response) => {
    const userId = requireUserId(req);

    const user = await getMe(userId);

    sendResponse(res, {
      success: true,
      message: "User retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        user,
      },
    });
  }),

  // Update Current User

  updateMe: catchAsync(async (req: Request, res: Response) => {
    const userId = requireUserId(req);

    const data = UpdateUserSchema.parse(req.body);

    const user = await updateMe(userId, data);

    sendResponse(res, {
      success: true,
      message: "User updated successfully",
      statusCode: httpStatus.OK,
      data: {
        user,
      },
    });
  }),

  // Delete Current User

  deleteMe: catchAsync(async (req: Request, res: Response) => {
    const userId = requireUserId(req);

    const result = await deleteMe(userId);

    sendResponse(res, {
      success: true,
      message: result.message,
      statusCode: httpStatus.OK,
    });
  }),
};
