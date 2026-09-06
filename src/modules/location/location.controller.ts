import type { Request, Response } from "express";
import httpStatus from "http-status";
import { LocationCreateSchema, LocationUpdateSchema } from "./location.schema";
import { LocationService } from "./location.service";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/appError";
import { sendResponse } from "../../utils/sendResponse";
import { requireAuth } from "../../middleware/auth.middleware";

export const LocationController = {
  // My Location

  getMyLocation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const location = await LocationService.getMyLocationFromDB({
      userId: user.id,
    });

    sendResponse(res, {
      success: true,
      message: "Location retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        location,
      },
    });
  }),

  createLocation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = LocationCreateSchema.parse(req.body);

    const location = await LocationService.createLocationIntoDB({
      userId: user.id,
      payload: data,
    });

    sendResponse(res, {
      success: true,
      message: "Location created successfully",
      statusCode: httpStatus.CREATED,
      data: {
        location,
      },
    });
  }),

  updateLocation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = LocationUpdateSchema.parse(req.body);

    const location = await LocationService.updateLocationIntoDB({
      userId: user.id,
      payload: data,
    });

    sendResponse(res, {
      success: true,
      message: "Location updated successfully",
      statusCode: httpStatus.OK,
      data: {
        location,
      },
    });
  }),

  deleteMyLocation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await LocationService.deleteMyLocationById({
      userId: user.id,
    });

    sendResponse(res, {
      success: true,
      message: "Location deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  // Location Discovery

  getLocationById: catchAsync(async (req: Request, res: Response) => {
    const locationId = req.params.locationId as string;

    if (!locationId) {
      throw new AppError("Location ID is required", httpStatus.BAD_REQUEST);
    }

    const location = await LocationService.getLocationFromDBById({
      locationId,
    });

    sendResponse(res, {
      success: true,
      message: "Location retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        location,
      },
    });
  }),

  // Moderator / Admin

  deleteLocationById: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const locationId = req.params.locationId as string;

    if (!locationId) {
      throw new AppError("Location ID is required", httpStatus.BAD_REQUEST);
    }

    await LocationService.deleteLocationById({
      userId: user.id,
      locationId,
    });

    sendResponse(res, {
      success: true,
      message: "Location deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
