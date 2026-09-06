import type { Request, Response } from "express";
import httpStatus from "http-status";

import {
  CreateDonationSchema,
  UpdateDonationStatusSchema,
} from "./donation.schema";

import { DonationService } from "./donation.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

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

  const donations = await DonationService.getMyDonations(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your donations retrieved successfully",
    data: donations,
  });
});

const getDonations = catchAsync(async (_req: Request, res: Response) => {
  const donations = await DonationService.getDonations();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donations retrieved successfully",
    data: donations,
  });
});

const getDonationById = catchAsync(async (req: Request, res: Response) => {
  const donationId = req.params.donationId as string;
  const { user } = requireAuth(req);

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

const verifyDonation = catchAsync(async (req: Request, res: Response) => {
  const donationId = req.params.donationId as string;

  const { user } = requireAuth(req);

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

const cancelMyDonation = catchAsync(async (req: Request, res: Response) => {
  const donationId = req.params.donationId as string;

  const { user } = requireAuth(req);

  const donation = await DonationService.cancelMyDonation(user.id, donationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donation cancelled successfully",
    data: donation,
  });
});

export const DonationController = {
  createDonation,
  getMyDonations,
  getDonations,
  getDonationById,
  verifyDonation,
  cancelMyDonation,
};
