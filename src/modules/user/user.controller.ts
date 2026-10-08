import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UpdateUserSchema } from "./user.schema";
import { deleteMe, getMe, getUser, updateMe } from "./user.service";

export const UserController = {
  // Public

  getUser: catchAsync(async (req: Request, res: Response) => {
    const user = await getUser(req.params.userId as string);

    sendResponse(res, {
      success: true,
      message: "User retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        user,
      },
    });
  }),

  // Current User

  getMe: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const result = await getMe(user.id);

    sendResponse(res, {
      success: true,
      message: "User retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        user: result,
      },
    });
  }),

  updateMe: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateUserSchema.parse(req.body);

    const result = await updateMe(user.id, data);

    sendResponse(res, {
      success: true,
      message: "User updated successfully",
      statusCode: httpStatus.OK,
      data: {
        user: result,
      },
    });
  }),

  deleteMe: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const result = await deleteMe(user.id);

    sendResponse(res, {
      success: true,
      message: result.message,
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
