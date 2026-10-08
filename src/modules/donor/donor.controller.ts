import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DonorQuerySchema, UpdateDonorProfileSchema } from "./donor.schema";
import { DonorService } from "./donor.service";

export const DonorController = {
  // My Donor Profile

  getMyDonorProfile: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const donor = await DonorService.getMyDonorProfile(user.id);

    sendResponse(res, {
      success: true,
      message: "Donor profile retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        donor,
      },
    });
  }),

  upsertMyDonorProfile: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateDonorProfileSchema.parse(req.body);

    const donor = await DonorService.upsertMyDonorProfile(user.id, data);

    sendResponse(res, {
      success: true,
      message: "Donor profile saved successfully",
      statusCode: httpStatus.OK,
      data: {
        donor,
      },
    });
  }),

  deleteMyDonorProfile: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await DonorService.deleteMyDonorProfile(user.id);

    sendResponse(res, {
      success: true,
      message: "Donor profile deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  // Donor Discovery

  getDonors: catchAsync(async (req: Request, res: Response) => {
    const query = DonorQuerySchema.parse(req.query);

    const result = await DonorService.getDonors(query);

    sendResponse(res, {
      success: true,
      message: "Donors retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        donors: result.data,
      },
      meta: result.meta,
    });
  }),

  getDonorById: catchAsync(async (req: Request, res: Response) => {
    const donor = await DonorService.getDonorById(req.params.donorId as string);

    sendResponse(res, {
      success: true,
      message: "Donor retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        donor,
      },
    });
  }),

  // Moderator / Admin

  updateDonorProfileById: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateDonorProfileSchema.parse(req.body);

    const donor = await DonorService.updateDonorProfileById(
      user.id,
      req.params.donorId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Donor profile updated successfully",
      statusCode: httpStatus.OK,
      data: {
        donor,
      },
    });
  }),

  deleteDonorProfileById: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await DonorService.deleteDonorProfileById(
      user.id,
      req.params.donorId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Donor profile deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
