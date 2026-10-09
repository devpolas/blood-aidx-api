import httpStatus from "http-status";

import type {
  CreateReviewInput,
  ReviewQueryInput,
  UpdateReviewInput,
  UpdateReviewStatusInput,
} from "./review.schema";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

// Helpers

const getReviewById = async (reviewId: string) => {
  const review = await db.orm.public.Review.where({
    id: reviewId,
  }).first();

  if (!review) {
    throw new AppError("Review not found", httpStatus.NOT_FOUND);
  }

  return review;
};

const getPaginationMeta = (page: number, limit: number, total: number) => {
  const totalPage = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPage,
    hasNextPage: page < totalPage,
    hasPreviousPage: page > 1 && totalPage > 0,
  };
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

const applyReviewSorting = (
  reviewQuery: ReturnType<typeof db.orm.public.Review.where>,
  query: ReviewQueryInput,
) => {
  const ascending = query.sortOrder === "asc";

  switch (query.sortBy) {
    case "updatedAt":
      return reviewQuery.orderBy((review) =>
        ascending ? review.updatedAt.asc() : review.updatedAt.desc(),
      );

    case "rating":
      return reviewQuery.orderBy((review) =>
        ascending ? review.rating.asc() : review.rating.desc(),
      );

    case "createdAt":
    default:
      return reviewQuery.orderBy((review) =>
        ascending ? review.createdAt.asc() : review.createdAt.desc(),
      );
  }
};

const getReviewList = async (
  reviewQuery: ReturnType<typeof db.orm.public.Review.where>,
  query: ReviewQueryInput,
) => {
  const totalResult = await reviewQuery.aggregate((review) => ({
    total: review.count(),
  }));

  const sortedQuery = applyReviewSorting(reviewQuery, query);

  const data = await sortedQuery
    .offset((query.page - 1) * query.limit)
    .limit(query.limit)
    .all();

  return {
    data,
    meta: getPaginationMeta(query.page, query.limit, totalResult.total),
  };
};

// Create

const createReview = async (reviewerId: string, data: CreateReviewInput) => {
  const target = await validateReviewTarget(reviewerId, data);

  let existingReviewQuery = db.orm.public.Review.where({
    reviewerId,
  });

  if (target.revieweeId !== undefined) {
    existingReviewQuery = existingReviewQuery.where({
      revieweeId: target.revieweeId,
    });
  } else if (target.organizationId !== undefined) {
    existingReviewQuery = existingReviewQuery.where({
      organizationId: target.organizationId,
    });
  }

  const existingReview = await existingReviewQuery.first();

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

// Current User

const getMyReviews = async (reviewerId: string, query: ReviewQueryInput) => {
  let reviewQuery = db.orm.public.Review.where({
    reviewerId,
  });

  if (query.status !== undefined) {
    reviewQuery = reviewQuery.where({
      status: query.status,
    });
  }

  if (query.rating !== undefined) {
    reviewQuery = reviewQuery.where({
      rating: query.rating,
    });
  }

  return getReviewList(reviewQuery, query);
};

// Public

const getReviewsForUser = async (userId: string, query: ReviewQueryInput) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  let reviewQuery = db.orm.public.Review.where({
    revieweeId: userId,
    status: "published",
  });

  if (query.rating !== undefined) {
    reviewQuery = reviewQuery.where({
      rating: query.rating,
    });
  }

  return getReviewList(reviewQuery, query);
};

const getReviewsForOrganization = async (
  organizationId: string,
  query: ReviewQueryInput,
) => {
  const organization = await db.orm.public.Organization.where({
    id: organizationId,
  }).first();

  if (!organization) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  let reviewQuery = db.orm.public.Review.where({
    organizationId,
    status: "published",
  });

  if (query.rating !== undefined) {
    reviewQuery = reviewQuery.where({
      rating: query.rating,
    });
  }

  return getReviewList(reviewQuery, query);
};

// Current User

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

// Moderator / Admin

const updateReviewStatus = async (
  reviewId: string,
  status: UpdateReviewStatusInput["status"],
) => {
  const review = await getReviewById(reviewId);

  if (review.status === status) {
    return review;
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
