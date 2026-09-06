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

// Authenticated

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

// Moderation

router.patch(
  "/:reviewId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireReviewModerator,
  ReviewController.updateReviewStatus,
);

export default router;
