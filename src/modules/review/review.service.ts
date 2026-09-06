import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  CreateReviewInput,
  UpdateReviewInput,
  UpdateReviewStatusInput,
} from "./review.schema";

const getReviewById = async (reviewId: string) => {
  const review = await db.orm.public.Review.where({
    id: reviewId,
  }).first();

  if (!review) {
    throw new AppError("Review not found", httpStatus.NOT_FOUND);
  }

  return review;
};

const validateReviewTarget = async (
  reviewerId: string,
  data: CreateReviewInput,
) => {
  if (data.revieweeId !== undefined) {
    if (data.revieweeId === reviewerId) {
      throw new AppError("You cannot review yourself", httpStatus.BAD_REQUEST);
    }

    const user = await db.orm.public.User.where({
      id: data.revieweeId,
    }).first();

    if (!user) {
      throw new AppError("Review target user not found", httpStatus.NOT_FOUND);
    }

    return {
      revieweeId: data.revieweeId,
      organizationId: undefined,
    };
  }

  if (data.organizationId !== undefined) {
    const organization = await db.orm.public.Organization.where({
      id: data.organizationId,
    }).first();

    if (!organization) {
      throw new AppError("Organization not found", httpStatus.NOT_FOUND);
    }

    if (
      organization.status !== "verified" &&
      organization.status !== "active"
    ) {
      throw new AppError(
        "This organization cannot receive reviews",
        httpStatus.BAD_REQUEST,
      );
    }

    return {
      revieweeId: undefined,
      organizationId: data.organizationId,
    };
  }

  throw new AppError("A review target is required", httpStatus.BAD_REQUEST);
};

const createReview = async (reviewerId: string, data: CreateReviewInput) => {
  const target = await validateReviewTarget(reviewerId, data);

  const existingReview = await db.orm.public.Review.where({
    reviewerId,
    ...(target.revieweeId !== undefined && {
      revieweeId: target.revieweeId,
    }),
    ...(target.organizationId !== undefined && {
      organizationId: target.organizationId,
    }),
  }).first();

  if (existingReview) {
    throw new AppError(
      "You have already reviewed this target",
      httpStatus.CONFLICT,
    );
  }

  return db.orm.public.Review.create({
    reviewerId,

    ...(target.revieweeId !== undefined && {
      revieweeId: target.revieweeId,
    }),

    ...(target.organizationId !== undefined && {
      organizationId: target.organizationId,
    }),

    rating: data.rating,

    comment: data.comment,

    status: "pending",
  });
};

const getMyReviews = async (reviewerId: string) => {
  return db.orm.public.Review.where({
    reviewerId,
  }).all();
};

const getReviewsForUser = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return db.orm.public.Review.where({
    revieweeId: userId,
    status: "published",
  }).all();
};

const getReviewsForOrganization = async (organizationId: string) => {
  const organization = await db.orm.public.Organization.where({
    id: organizationId,
  }).first();

  if (!organization) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  return db.orm.public.Review.where({
    organizationId,
    status: "published",
  }).all();
};

const getReviewByIdForUser = async (reviewId: string, userId: string) => {
  const review = await getReviewById(reviewId);

  if (review.reviewerId !== userId && review.status !== "published") {
    throw new AppError(
      "You do not have access to this review",
      httpStatus.FORBIDDEN,
    );
  }

  return review;
};

const updateReview = async (
  reviewId: string,
  reviewerId: string,
  data: UpdateReviewInput,
) => {
  const review = await getReviewById(reviewId);

  if (review.reviewerId !== reviewerId) {
    throw new AppError(
      "Only the review author can update this review",
      httpStatus.FORBIDDEN,
    );
  }

  if (review.status === "rejected") {
    throw new AppError(
      "Rejected reviews cannot be edited",
      httpStatus.BAD_REQUEST,
    );
  }

  const updateData = {
    ...(data.rating !== undefined && {
      rating: data.rating,
    }),

    ...(data.comment !== undefined && {
      comment: data.comment,
    }),

    // Editing a published review sends it
    // through moderation again.
    ...(review.status === "published" && {
      status: "pending" as const,
    }),
  };

  return db.orm.public.Review.where({
    id: reviewId,
  }).update(updateData);
};

const deleteReview = async (reviewId: string, reviewerId: string) => {
  const review = await getReviewById(reviewId);

  if (review.reviewerId !== reviewerId) {
    throw new AppError(
      "Only the review author can delete this review",
      httpStatus.FORBIDDEN,
    );
  }

  await db.orm.public.Review.where({
    id: reviewId,
  }).delete();
};

const updateReviewStatus = async (
  reviewId: string,
  status: UpdateReviewStatusInput["status"],
) => {
  const review = await getReviewById(reviewId);

  if (status === "published") {
    if (review.status === "published") {
      return review;
    }

    return db.orm.public.Review.where({
      id: reviewId,
    }).update({
      status: "published",
    });
  }

  return db.orm.public.Review.where({
    id: reviewId,
  }).update({
    status,
  });
};

export const ReviewService = {
  createReview,
  getMyReviews,
  getReviewsForUser,
  getReviewsForOrganization,
  getReviewByIdForUser,
  updateReview,
  deleteReview,
  updateReviewStatus,
};
