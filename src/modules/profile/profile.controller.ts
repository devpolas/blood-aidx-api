import type { Request, Response } from "express";
import httpStatus from "http-status";
import { ProfileService } from "./profile.service";
import { UpdateProfileSchema } from "./profile.schema";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth } from "../../middleware/auth.middleware";

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

const createMyProfile = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const data = UpdateProfileSchema.parse(req.body);
  const profile = await ProfileService.createMyProfile(user.id, data);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Profile created successfully",
    data: profile,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const data = UpdateProfileSchema.parse(req.body);
  const profile = await ProfileService.updateMyProfile(user.id, data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
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

export const ProfileController = {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
  deleteMyProfile,
};
