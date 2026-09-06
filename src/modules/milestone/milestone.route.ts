import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireRole,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

import { MilestoneController } from "./milestone.controller";

const router: ExpressRouter = Router();

// Public Routes

router.get("/", MilestoneController.getMilestones);
router.get("/:milestoneId", MilestoneController.getMilestoneById);

// Protected Routes

router.use(protect, requireActiveUser);

// Current User

router.get("/my", requireVerifiedEmail, MilestoneController.getMyMilestones);

// Moderator / Admin

router.get(
  "/user/:userId",
  requireVerifiedEmail,
  requireRole("moderator", "admin"),
  MilestoneController.getUserMilestones,
);

// Admin

router.post(
  "/",
  requireVerifiedEmail,
  requireRole("admin"),
  MilestoneController.createMilestone,
);

router.patch(
  "/:milestoneId",
  requireVerifiedEmail,
  requireRole("admin"),
  MilestoneController.updateMilestone,
);

router.delete(
  "/:milestoneId",
  requireVerifiedEmail,
  requireRole("admin"),
  MilestoneController.deleteMilestone,
);

export default router;
