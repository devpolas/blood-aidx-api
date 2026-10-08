import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UpdateProfileSchema } from "./profile.schema";
import { ProfileService } from "./profile.service";

export const ProfileController = {
  // Public

  getProfileByUserId: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    const profile = await ProfileService.getUserProfileByUserId(userId);

    sendResponse(res, {
      success: true,
      message: "Profile retrieved successfully",
      statusCode: httpStatus.OK,
      data: { profile },
    });
  }),

  // My Profile

  getMyProfile: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const profile = await ProfileService.getMyProfile(user.id);

    sendResponse(res, {
      success: true,
      message: "Profile retrieved successfully",
      statusCode: httpStatus.OK,
      data: { profile },
    });
  }),

  upsertMyProfile: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateProfileSchema.parse(req.body);

    const profile = await ProfileService.upsertMyProfile(user.id, data);

    sendResponse(res, {
      success: true,
      message: "Profile saved successfully",
      statusCode: httpStatus.OK,
      data: { profile },
    });
  }),

  deleteMyProfile: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await ProfileService.deleteMyProfile(user.id);

    sendResponse(res, {
      success: true,
      message: "Profile deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  // Moderator / Admin

  updateProfileByUserId: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const userId = req.params.userId as string;

    const data = UpdateProfileSchema.parse(req.body);

    const profile = await ProfileService.updateProfileByUserId(
      user.id,
      userId,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Profile updated successfully",
      statusCode: httpStatus.OK,
      data: { profile },
    });
  }),

  deleteProfileByUserId: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const userId = req.params.userId as string;

    await ProfileService.deleteProfileByUserId(user.id, userId);

    sendResponse(res, {
      success: true,
      message: "Profile deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
