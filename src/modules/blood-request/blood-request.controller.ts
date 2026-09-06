import type { Request, Response } from "express";

import httpStatus from "http-status";

import {
  CreateBloodRequestSchema,
  UpdateBloodRequestSchema,
  UpdateBloodRequestStatusSchema,
} from "./blood-request.schema";

import { BloodRequestService } from "./blood-request.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// Get My Blood Requests

const getMyBloodRequests = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const requests = await BloodRequestService.getMyBloodRequests(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood requests retrieved successfully",
    data: requests,
  });
});

// Get All Blood Requests

const getBloodRequests = catchAsync(async (_req: Request, res: Response) => {
  const requests = await BloodRequestService.getBloodRequests();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood requests retrieved successfully",
    data: requests,
  });
});

// Get Blood Request By ID

const getBloodRequestById = catchAsync(async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;

  if (!requestId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Blood request ID is required",
      data: null,
    });
  }

  const request = await BloodRequestService.getBloodRequestById(requestId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request retrieved successfully",
    data: request,
  });
});

// Create Blood Request

const createBloodRequest = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = CreateBloodRequestSchema.parse(req.body);

  const request = await BloodRequestService.createBloodRequest(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blood request created successfully",
    data: request,
  });
});

// Update Blood Request

const updateBloodRequest = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const requestId = req.params.requestId as string;

  if (!requestId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Blood request ID is required",
      data: null,
    });
  }

  const data = UpdateBloodRequestSchema.parse(req.body);

  const request = await BloodRequestService.updateBloodRequest(
    user.id,
    requestId,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request updated successfully",
    data: request,
  });
});

// Update Blood Request Status

const updateBloodRequestStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const requestId = req.params.requestId as string;

    if (!requestId) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Blood request ID is required",
        data: null,
      });
    }

    const data = UpdateBloodRequestStatusSchema.parse(req.body);

    const request = await BloodRequestService.updateBloodRequestStatus(
      user.id,
      requestId,
      data,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood request status updated successfully",
      data: request,
    });
  },
);

// Cancel Blood Request

const cancelBloodRequest = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const requestId = req.params.requestId as string;

  if (!requestId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Blood request ID is required",
      data: null,
    });
  }

  const request = await BloodRequestService.cancelBloodRequest(
    user.id,
    requestId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request cancelled successfully",
    data: request,
  });
});

// Delete Blood Request

const deleteBloodRequest = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const requestId = req.params.requestId as string;

  if (!requestId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Blood request ID is required",
      data: null,
    });
  }

  await BloodRequestService.deleteBloodRequest(user.id, requestId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request deleted successfully",
    data: null,
  });
});

// Export

export const BloodRequestController = {
  getMyBloodRequests,
  getBloodRequests,
  getBloodRequestById,
  createBloodRequest,
  updateBloodRequest,
  updateBloodRequestStatus,
  cancelBloodRequest,
  deleteBloodRequest,
};
