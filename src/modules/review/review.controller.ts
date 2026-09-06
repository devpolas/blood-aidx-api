import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  UpdateReviewStatusSchema,
} from "./review.schema";

import { ReviewService } from "./review.service";
import { requireAuth } from "../../middleware/auth.middleware";

const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = CreateReviewSchema.parse(req.body);

    const result = await ReviewService.createReview(user.id, data);

    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Review created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await ReviewService.getMyReviews(user.id);

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewsForUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await ReviewService.getReviewsForUser(
      req.params.userId as string,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewsForOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await ReviewService.getReviewsForOrganization(
      req.params.organizationId as string,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await ReviewService.getReviewByIdForUser(
      req.params.reviewId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = UpdateReviewSchema.parse(req.body);

    const result = await ReviewService.updateReview(
      req.params.reviewId as string,
      user.id,
      data,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Review updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    await ReviewService.deleteReview(req.params.reviewId as string, user.id);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const updateReviewStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = UpdateReviewStatusSchema.parse(req.body);

    const result = await ReviewService.updateReviewStatus(
      req.params.reviewId as string,
      data.status,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Review status updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

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
