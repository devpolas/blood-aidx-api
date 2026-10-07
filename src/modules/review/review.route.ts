import { Router, type Router as ExpressRouter } from "express";

import { ReviewController } from "./review.controller";

import {
  protect,
  requireActiveUser,
  requireRole,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

const requireReviewModerator = requireRole("moderator", "admin");

// Public
router.get("/user/:userId", ReviewController.getReviewsForUser);

router.get(
  "/organization/:organizationId",
  ReviewController.getReviewsForOrganization,
);

// Current User
router.get(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ReviewController.getMyReviews,
);

router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ReviewController.createReview,
);

// Moderation
router.patch(
  "/:reviewId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireReviewModerator,
  ReviewController.updateReviewStatus,
);

// Individual Review
router.get(
  "/:reviewId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ReviewController.getReviewById,
);

router.patch(
  "/:reviewId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ReviewController.updateReview,
);

router.delete(
  "/:reviewId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ReviewController.deleteReview,
);

export default router;
