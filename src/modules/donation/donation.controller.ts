import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import {
  CreateDonationSchema,
  DonationQuerySchema,
  UpdateDonationStatusSchema,
} from "./donation.schema";

import { DonationService } from "./donation.service";

export const DonationController = {
  // Donor

  createDonation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = CreateDonationSchema.parse(req.body);

    const donation = await DonationService.createDonation(user.id, data);

    sendResponse(res, {
      success: true,
      message: "Donation created successfully",
      statusCode: httpStatus.CREATED,
      data: {
        donation,
      },
    });
  }),

  getMyDonations: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const query = DonationQuerySchema.parse(req.query);

    const result = await DonationService.getMyDonations(user.id, query);

    sendResponse(res, {
      success: true,
      message: "Your donations retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        donations: result.data,
      },
      meta: result.meta,
    });
  }),

  // Donation

  getDonationById: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const donation = await DonationService.getDonationByIdForUser(
      user.id,
      req.params.donationId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Donation retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        donation,
      },
    });
  }),

  cancelMyDonation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const donation = await DonationService.cancelMyDonation(
      user.id,
      req.params.donationId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Donation cancelled successfully",
      statusCode: httpStatus.OK,
      data: {
        donation,
      },
    });
  }),

  // Public Donor Profile

  getDonorDonations: catchAsync(async (req: Request, res: Response) => {
    const query = DonationQuerySchema.parse(req.query);

    const result = await DonationService.getDonorDonations(
      req.params.donorId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      message: "Donor donations retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        donations: result.data,
      },
      meta: result.meta,
    });
  }),

  // Moderator / Admin

  getDonations: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const query = DonationQuerySchema.parse(req.query);

    const result = await DonationService.getDonations(user.id, query);

    sendResponse(res, {
      success: true,
      message: "Donations retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        donations: result.data,
      },
      meta: result.meta,
    });
  }),

  verifyDonation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateDonationStatusSchema.parse(req.body);

    const donation = await DonationService.verifyDonation(
      user.id,
      req.params.donationId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Donation status updated successfully",
      statusCode: httpStatus.OK,
      data: {
        donation,
      },
    });
  }),
};
