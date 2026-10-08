import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import {
  BloodRequestResponseQuerySchema,
  CreateBloodRequestResponseSchema,
  UpdateBloodRequestResponseStatusSchema,
} from "./blood-request-response.schema";

import { BloodRequestResponseService } from "./blood-request-response.service";

export const BloodRequestResponseController = {
  // Create

  createResponse: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = CreateBloodRequestResponseSchema.parse(req.body);

    const response = await BloodRequestResponseService.createResponse(
      user.id,
      req.params.requestId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request response created successfully",
      statusCode: httpStatus.CREATED,
      data: {
        response,
      },
    });
  }),

  // Current User

  getMyResponses: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const query = BloodRequestResponseQuerySchema.parse(req.query);

    const result = await BloodRequestResponseService.getMyResponses(
      user.id,
      query,
    );

    sendResponse(res, {
      success: true,
      message: "Your blood request responses retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        responses: result.data,
      },
      meta: result.meta,
    });
  }),

  getResponseById: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const response = await BloodRequestResponseService.getResponseByIdForUser(
      user.id,
      req.params.responseId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request response retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        response,
      },
    });
  }),

  cancelMyResponse: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const response = await BloodRequestResponseService.cancelMyResponse(
      user.id,
      req.params.responseId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request response cancelled successfully",
      statusCode: httpStatus.OK,
      data: {
        response,
      },
    });
  }),

  deleteMyResponse: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await BloodRequestResponseService.deleteMyResponse(
      user.id,
      req.params.responseId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request response deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  // Blood Request

  getResponsesForRequest: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const query = BloodRequestResponseQuerySchema.parse(req.query);

    const result = await BloodRequestResponseService.getResponsesForRequest(
      user.id,
      req.params.requestId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request responses retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        responses: result.data,
      },
      meta: result.meta,
    });
  }),

  // Status

  updateResponseStatus: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateBloodRequestResponseStatusSchema.parse(req.body);

    const response = await BloodRequestResponseService.updateResponseStatus(
      user.id,
      req.params.responseId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Blood request response status updated successfully",
      statusCode: httpStatus.OK,
      data: {
        response,
      },
    });
  }),
};
