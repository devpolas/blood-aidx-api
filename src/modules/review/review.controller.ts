import type { Request, Response } from "express";

import httpStatus from "http-status";

import {
  CreateReviewSchema,
  UpdateReviewSchema,
  UpdateReviewStatusSchema,
} from "./review.schema";

import { ReviewService } from "./review.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = CreateReviewSchema.parse(req.body);

  const result = await ReviewService.createReview(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await ReviewService.getMyReviews(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews retrieved successfully",
    data: result,
  });
});

const getReviewsForUser = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getReviewsForUser(
    req.params.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User reviews retrieved successfully",
    data: result,
  });
});

const getReviewsForOrganization = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ReviewService.getReviewsForOrganization(
      req.params.organizationId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization reviews retrieved successfully",
      data: result,
    });
  },
);

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await ReviewService.getReviewByIdForUser(
    req.params.reviewId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review retrieved successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = UpdateReviewSchema.parse(req.body);

  const result = await ReviewService.updateReview(
    req.params.reviewId as string,
    user.id,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await ReviewService.deleteReview(req.params.reviewId as string, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted successfully",
  });
});

const updateReviewStatus = catchAsync(async (req: Request, res: Response) => {
  const data = UpdateReviewStatusSchema.parse(req.body);

  const result = await ReviewService.updateReviewStatus(
    req.params.reviewId as string,
    data.status,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review status updated successfully",
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getMyReviews,
  getReviewsForUser,
  getReviewsForOrganization,
  getReviewById,
  updateReview,
  deleteReview,
  updateReviewStatus,
};
