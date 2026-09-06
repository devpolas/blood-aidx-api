import type { Request, Response } from "express";
import httpStatus from "http-status";

import { BloodRequestService } from "./blood-request.service";
import {
  CreateBloodRequestSchema,
  UpdateBloodRequestSchema,
  UpdateBloodRequestStatusSchema,
} from "./blood-request.schema";
import { requireAuth } from "../middleware/auth.middleware";
import { sendResponse } from "../utils/sendResponse";
import { catchAsync } from "../utils/catchAsync";

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

const getBloodRequests = catchAsync(async (_req: Request, res: Response) => {
  const requests = await BloodRequestService.getBloodRequests();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood requests retrieved successfully",
    data: requests,
  });
});

const getBloodRequestById = catchAsync(async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;
  const request = await BloodRequestService.getBloodRequestById(requestId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request retrieved successfully",
    data: request,
  });
});

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

const updateBloodRequest = catchAsync(async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;

  const { user } = requireAuth(req);

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

const updateBloodRequestStatus = catchAsync(
  async (req: Request, res: Response) => {
    const requestId = req.params.requestId as string;

    const { user } = requireAuth(req);

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

const cancelBloodRequest = catchAsync(async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;

  const { user } = requireAuth(req);

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

const deleteBloodRequest = catchAsync(async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;

  const { user } = requireAuth(req);

  await BloodRequestService.deleteBloodRequest(user.id, requestId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request deleted successfully",
    data: null,
  });
});

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
