import type { Request, Response } from "express";

import { LocationCreateSchema, LocationUpdateSchema } from "./location.schema";

import {
  createLocationIntoDB,
  deleteLocationById,
  deleteMyLocationById,
  getLocationFromDBById,
  getMyLocationFromDB,
  updateLocationIntoDB,
} from "./location.service";

import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../utils/appError";
import { sendResponse } from "../../utils/sendResponse";

// Helpers

const requireAuth = (req: Request) => {
  if (!req.auth?.user) {
    throw new AppError("Please login first", 401);
  }

  return req.auth.user;
};

// Location Controller

export const LocationController = {
  // Get My Location
  // GET /locations/me

  getMyLocation: catchAsync(async (req: Request, res: Response) => {
    const user = requireAuth(req);

    const location = await getMyLocationFromDB({
      userId: user.id,
    });

    sendResponse(res, {
      success: true,
      message: "Location retrieved successfully",
      statusCode: 200,
      data: {
        location,
      },
    });
  }),

  // Get Location By ID
  // GET /locations/:locationId

  getLocationById: catchAsync(async (req: Request, res: Response) => {
    const locationId = req.params.locationId as string;

    if (!locationId) {
      throw new AppError("Location ID is required", 400);
    }

    const location = await getLocationFromDBById({
      locationId,
    });

    sendResponse(res, {
      success: true,
      message: "Location retrieved successfully",
      statusCode: 200,
      data: {
        location,
      },
    });
  }),

  // Create Location
  // POST /locations

  createLocation: catchAsync(async (req: Request, res: Response) => {
    const user = requireAuth(req);

    const data = LocationCreateSchema.parse(req.body);

    const location = await createLocationIntoDB({
      userId: user.id,
      payload: data,
    });

    sendResponse(res, {
      success: true,
      message: "Location created successfully",
      statusCode: 201,
      data: {
        location,
      },
    });
  }),

  // Update My Location
  // PATCH /locations/me

  updateLocation: catchAsync(async (req: Request, res: Response) => {
    const user = requireAuth(req);

    const data = LocationUpdateSchema.parse(req.body);

    const location = await updateLocationIntoDB({
      userId: user.id,
      payload: data,
    });

    sendResponse(res, {
      success: true,
      message: "Location updated successfully",
      statusCode: 200,
      data: {
        location,
      },
    });
  }),

  // Delete My Location
  // DELETE /locations/me

  deleteMyLocation: catchAsync(async (req: Request, res: Response) => {
    const user = requireAuth(req);

    await deleteMyLocationById({
      userId: user.id,
    });

    sendResponse(res, {
      success: true,
      message: "Location deleted successfully",
      statusCode: 200,
    });
  }),

  // Delete Location By ID
  // DELETE /locations/:locationId
  // Admin / Moderator

  deleteLocationById: catchAsync(async (req: Request, res: Response) => {
    requireAuth(req);

    const locationId = req.params.locationId as string;

    if (!locationId) {
      throw new AppError("Location ID is required", 400);
    }

    await deleteLocationById({
      locationId,
    });

    sendResponse(res, {
      success: true,
      message: "Location deleted successfully",
      statusCode: 200,
    });
  }),
};
