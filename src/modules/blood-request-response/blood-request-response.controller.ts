import type { Request, Response } from "express";
import httpStatus from "http-status";

import {
  CreateBloodRequestResponseSchema,
  UpdateBloodRequestResponseStatusSchema,
} from "./blood-request-response.schema";

import { BloodRequestResponseService } from "./blood-request-response.service";
import { catchAsync } from "../../utils/catchAsync";
import { requireAuth } from "../../middleware/auth.middleware";
import { sendResponse } from "../../utils/sendResponse";

const createResponse = catchAsync(async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;
  const { user } = requireAuth(req);

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

const getResponsesForRequest = catchAsync(
  async (req: Request, res: Response) => {
    const requestId = req.params.requestId as string;
    const { user } = requireAuth(req);

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

const getResponseById = catchAsync(async (req: Request, res: Response) => {
  const responseId = req.params.responseId as string;
  const { user } = requireAuth(req);

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

const updateResponseStatus = catchAsync(async (req: Request, res: Response) => {
  const responseId = req.params.responseId as string;
  const { user } = requireAuth(req);

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

const cancelMyResponse = catchAsync(async (req: Request, res: Response) => {
  const responseId = req.params.responseId as string;
  const { user } = requireAuth(req);

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

const deleteMyResponse = catchAsync(async (req: Request, res: Response) => {
  const responseId = req.params.responseId as string;
  const { user } = requireAuth(req);

  await BloodRequestResponseService.deleteMyResponse(user.id, responseId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request response deleted successfully",
    data: null,
  });
});

export const BloodRequestResponseController = {
  createResponse,
  getMyResponses,
  getResponsesForRequest,
  getResponseById,
  updateResponseStatus,
  cancelMyResponse,
  deleteMyResponse,
};
