import type { Request, Response } from "express";
import httpStatus from "http-status";

import {
  CreateDonationSchema,
  DonationQuerySchema,
  UpdateDonationStatusSchema,
} from "./donation.schema";
import { DonationService } from "./donation.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// Donor

const createDonation = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = CreateDonationSchema.parse(req.body);

  const donation = await DonationService.createDonation(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Donation created successfully",
    data: donation,
  });
});

const getMyDonations = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const query = DonationQuerySchema.parse(req.query);

  const donations = await DonationService.getMyDonations(user.id, query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your donations retrieved successfully",
    data: donations.data,
    meta: donations.meta,
  });
});

const getDonationById = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const donationId = req.params.donationId as string;

  const donation = await DonationService.getDonationByIdForUser(
    user.id,
    donationId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donation retrieved successfully",
    data: donation,
  });
});

const cancelMyDonation = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const donationId = req.params.donationId as string;

  const donation = await DonationService.cancelMyDonation(user.id, donationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donation cancelled successfully",
    data: donation,
  });
});

// Public Donor Profile

const getDonorDonations = catchAsync(async (req: Request, res: Response) => {
  const donorId = req.params.donorId as string;

  const query = DonationQuerySchema.parse(req.query);

  const donations = await DonationService.getDonorDonations(donorId, query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor donations retrieved successfully",
    data: donations.data,
    meta: donations.meta,
  });
});

// Moderator / Admin

const getDonations = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const query = DonationQuerySchema.parse(req.query);

  const donations = await DonationService.getDonations(user.id, query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donations retrieved successfully",
    data: donations.data,
    meta: donations.meta,
  });
});

const verifyDonation = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const donationId = req.params.donationId as string;

  const data = UpdateDonationStatusSchema.parse(req.body);

  const donation = await DonationService.verifyDonation(
    user.id,
    donationId,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donation status updated successfully",
    data: donation,
  });
});

export const DonationController = {
  createDonation,
  getMyDonations,
  getDonationById,
  cancelMyDonation,
  getDonorDonations,
  getDonations,
  verifyDonation,
};
