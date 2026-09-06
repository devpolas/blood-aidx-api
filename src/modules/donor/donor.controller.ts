import type { Request, Response } from "express";
import httpStatus from "http-status";

import { DonorService } from "./donor.service";
import { UpdateDonorProfileSchema } from "./donor.schema";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth } from "../../middleware/auth.middleware";

const getMyDonorProfile = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const donor = await DonorService.getMyDonorProfile(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor profile retrieved successfully",
    data: donor,
  });
});

const upsertMyDonorProfile = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = UpdateDonorProfileSchema.parse(req.body);

  const donor = await DonorService.upsertMyDonorProfile(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor profile saved successfully",
    data: donor,
  });
});

const deleteMyDonorProfile = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await DonorService.deleteMyDonorProfile(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor profile deleted successfully",
    data: null,
  });
});

const getDonorById = catchAsync(async (req: Request, res: Response) => {
  const donorId = req.params.donorId as string;

  const donor = await DonorService.getDonorById(donorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor retrieved successfully",
    data: donor,
  });
});

const getDonors = catchAsync(async (_req: Request, res: Response) => {
  const donors = await DonorService.getDonors();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donors retrieved successfully",
    data: donors,
  });
});

export const DonorController = {
  getMyDonorProfile,
  upsertMyDonorProfile,
  deleteMyDonorProfile,
  getDonorById,
  getDonors,
};
