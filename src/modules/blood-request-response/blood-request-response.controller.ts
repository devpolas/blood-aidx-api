import type { Request, Response } from "express";

import httpStatus from "http-status";

import {
  CreateBloodRequestResponseSchema,
  UpdateBloodRequestResponseStatusSchema,
} from "./blood-request-response.schema";

import { BloodRequestResponseService } from "./blood-request-response.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// Create Response

const createResponse = catchAsync(async (req: Request, res: Response) => {
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

  const data = CreateBloodRequestResponseSchema.parse(req.body);

  const response = await BloodRequestResponseService.createResponse(
    user.id,
    requestId,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blood request response created successfully",
    data: response,
  });
});

// Get My Responses

const getMyResponses = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const responses = await BloodRequestResponseService.getMyResponses(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your blood request responses retrieved successfully",
    data: responses,
  });
});

// Get Responses For Request

const getResponsesForRequest = catchAsync(
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

    const responses = await BloodRequestResponseService.getResponsesForRequest(
      user.id,
      requestId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood request responses retrieved successfully",
      data: responses,
    });
  },
);

// Get Response By ID

const getResponseById = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const responseId = req.params.responseId as string;

  if (!responseId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Response ID is required",
      data: null,
    });
  }

  const response = await BloodRequestResponseService.getResponseByIdForUser(
    user.id,
    responseId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request response retrieved successfully",
    data: response,
  });
});

// Update Response Status

const updateResponseStatus = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const responseId = req.params.responseId as string;

  if (!responseId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Response ID is required",
      data: null,
    });
  }

  const data = UpdateBloodRequestResponseStatusSchema.parse(req.body);

  const response = await BloodRequestResponseService.updateResponseStatus(
    user.id,
    responseId,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request response status updated successfully",
    data: response,
  });
});

// Cancel My Response

const cancelMyResponse = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const responseId = req.params.responseId as string;

  if (!responseId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Response ID is required",
      data: null,
    });
  }

  const response = await BloodRequestResponseService.cancelMyResponse(
    user.id,
    responseId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request response cancelled successfully",
    data: response,
  });
});

// Delete My Response

const deleteMyResponse = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const responseId = req.params.responseId as string;

  if (!responseId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Response ID is required",
      data: null,
    });
  }

  await BloodRequestResponseService.deleteMyResponse(user.id, responseId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request response deleted successfully",
    data: null,
  });
});

// Export

export const BloodRequestResponseController = {
  createResponse,
  getMyResponses,
  getResponsesForRequest,
  getResponseById,
  updateResponseStatus,
  cancelMyResponse,
  deleteMyResponse,
};
