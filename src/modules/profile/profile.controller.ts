import type { Request, Response } from "express";

import httpStatus from "http-status";

import { ProfileService } from "./profile.service";
import { UpdateProfileSchema } from "./profile.schema";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth } from "../../middleware/auth.middleware";

// My Profile

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const profile = await ProfileService.getMyProfile(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: profile,
  });
});

const upsertMyProfile = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = UpdateProfileSchema.parse(req.body);

  const profile = await ProfileService.upsertMyProfile(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile saved successfully",
    data: profile,
  });
});

const deleteMyProfile = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await ProfileService.deleteMyProfile(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile deleted successfully",
    data: null,
  });
});

// Moderator / Admin

const getProfileByUserId = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const userId = req.params.userId as string;

  const profile = await ProfileService.getProfileByUserIdForModerator(
    user.id,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: profile,
  });
});

const updateProfileByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const userId = req.params.userId as string;

    const data = UpdateProfileSchema.parse(req.body);

    const profile = await ProfileService.updateProfileByUserId(
      user.id,
      userId,
      data,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  },
);

const deleteProfileByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const userId = req.params.userId as string;

    await ProfileService.deleteProfileByUserId(user.id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile deleted successfully",
      data: null,
    });
  },
);

export const ProfileController = {
  // My profile
  getMyProfile,
  upsertMyProfile,
  deleteMyProfile,

  // Moderator / Admin
  getProfileByUserId,
  updateProfileByUserId,
  deleteProfileByUserId,
};
