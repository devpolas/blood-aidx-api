import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import {
  BloodRequestQuerySchema,
  CreateBloodRequestSchema,
  UpdateBloodRequestSchema,
  UpdateBloodRequestStatusSchema,
} from "./blood-request.schema";

import { BloodRequestService } from "./blood-request.service";

export const BloodRequestController = {
  // Public

  getBloodRequests: catchAsync(async (req: Request, res: Response) => {
    const query = BloodRequestQuerySchema.parse(req.query);

    const result = await BloodRequestService.getBloodRequests(query);

    sendResponse(res, {
      success: true,
      message: "Blood requests retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        requests: result.data,
      },
      meta: result.meta,
    });
  }),

  getBloodRequestById: catchAsync(async (req: Request, res: Response) => {
    const request = await BloodRequestService.getBloodRequestById(
      req.params.requestId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        request,
      },
    });
  }),

  // Current User

  getMyBloodRequests: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const query = BloodRequestQuerySchema.parse(req.query);

    const result = await BloodRequestService.getMyBloodRequests(user.id, query);

    sendResponse(res, {
      success: true,
      message: "Your blood requests retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        requests: result.data,
      },
      meta: result.meta,
    });
  }),

  // Create

  createBloodRequest: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = CreateBloodRequestSchema.parse(req.body);

    const request = await BloodRequestService.createBloodRequest(user.id, data);

    sendResponse(res, {
      success: true,
      message: "Blood request created successfully",
      statusCode: httpStatus.CREATED,
      data: {
        request,
      },
    });
  }),

  // Update

  updateBloodRequest: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateBloodRequestSchema.parse(req.body);

    const request = await BloodRequestService.updateBloodRequest(
      user.id,
      req.params.requestId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request updated successfully",
      statusCode: httpStatus.OK,
      data: {
        request,
      },
    });
  }),

  // Status

  updateBloodRequestStatus: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateBloodRequestStatusSchema.parse(req.body);

    const request = await BloodRequestService.updateBloodRequestStatus(
      user.id,
      req.params.requestId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request status updated successfully",
      statusCode: httpStatus.OK,
      data: {
        request,
      },
    });
  }),

  // Cancel

  cancelBloodRequest: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const request = await BloodRequestService.cancelBloodRequest(
      user.id,
      req.params.requestId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request cancelled successfully",
      statusCode: httpStatus.OK,
      data: {
        request,
      },
    });
  }),

  // Delete

  deleteBloodRequest: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await BloodRequestService.deleteBloodRequest(
      user.id,
      req.params.requestId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
