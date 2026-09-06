import type { Request, Response } from "express";

import httpStatus from "http-status";

import { DonorService } from "./donor.service";
import { UpdateDonorProfileSchema } from "./donor.schema";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// My Donor Profile

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

// Donor Discovery

const getDonorById = catchAsync(async (req: Request, res: Response) => {
  const donorId = req.params.donorId;

  const donor = await DonorService.getDonorById(donorId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor retrieved successfully",
    data: donor,
  });
});

const getDonors = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const donors = await DonorService.getDonors(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donors retrieved successfully",
    data: donors,
  });
});

// Moderator / Admin

const updateDonorProfileById = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const donorId = req.params.donorId as string;

    const data = UpdateDonorProfileSchema.parse(req.body);

    const donor = await DonorService.updateDonorProfileById(
      user.id,
      donorId,
      data,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Donor profile updated successfully",
      data: donor,
    });
  },
);

const deleteDonorProfileById = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const donorId = req.params.donorId as string;

    await DonorService.deleteDonorProfileById(user.id, donorId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Donor profile deleted successfully",
      data: null,
    });
  },
);

// Export

export const DonorController = {
  getMyDonorProfile,
  upsertMyDonorProfile,
  deleteMyDonorProfile,

  getDonorById,
  getDonors,

  updateDonorProfileById,
  deleteDonorProfileById,
};
