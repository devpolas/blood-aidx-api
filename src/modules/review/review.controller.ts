import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import {
  CreateReviewSchema,
  ReviewQuerySchema,
  UpdateReviewSchema,
  UpdateReviewStatusSchema,
} from "./review.schema";

import { ReviewService } from "./review.service";

export const ReviewController = {
  // Create

  createReview: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = CreateReviewSchema.parse(req.body);

    const review = await ReviewService.createReview(user.id, data);

    sendResponse(res, {
      success: true,
      message: "Review created successfully",
      statusCode: httpStatus.CREATED,
      data: { review },
    });
  }),

  // Current User

  getMyReviews: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const query = ReviewQuerySchema.parse(req.query);

    const result = await ReviewService.getMyReviews(user.id, query);

    sendResponse(res, {
      success: true,
      message: "Reviews retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        reviews: result.data,
      },
      meta: result.meta,
    });
  }),

  getReviewById: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const review = await ReviewService.getReviewByIdForUser(
      req.params.reviewId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Review retrieved successfully",
      statusCode: httpStatus.OK,
      data: { review },
    });
  }),

  updateReview: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateReviewSchema.parse(req.body);

    const review = await ReviewService.updateReview(
      req.params.reviewId as string,
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Review updated successfully",
      statusCode: httpStatus.OK,
      data: { review },
    });
  }),

  deleteReview: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await ReviewService.deleteReview(req.params.reviewId as string, user.id);

    sendResponse(res, {
      success: true,
      message: "Review deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  // Public

  getReviewsForUser: catchAsync(async (req: Request, res: Response) => {
    const query = ReviewQuerySchema.parse(req.query);

    const result = await ReviewService.getReviewsForUser(
      req.params.userId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      message: "User reviews retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        reviews: result.data,
      },
      meta: result.meta,
    });
  }),

  getReviewsForOrganization: catchAsync(async (req: Request, res: Response) => {
    const query = ReviewQuerySchema.parse(req.query);

    const result = await ReviewService.getReviewsForOrganization(
      req.params.organizationId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      message: "Organization reviews retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        reviews: result.data,
      },
      meta: result.meta,
    });
  }),

  // Moderator / Admin

  updateReviewStatus: catchAsync(async (req: Request, res: Response) => {
    const data = UpdateReviewStatusSchema.parse(req.body);

    const review = await ReviewService.updateReviewStatus(
      req.params.reviewId as string,
      data.status,
    );

    sendResponse(res, {
      success: true,
      message: "Review status updated successfully",
      statusCode: httpStatus.OK,
      data: { review },
    });
  }),
};
