import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireRole,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";
import { MilestoneController } from "./milestone.controller";

const router: ExpressRouter = Router();

// Public

router.get("/", MilestoneController.getMilestones);

router.get("/:milestoneId", MilestoneController.getMilestoneById);

// Current User

router.get(
  "/my",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MilestoneController.getMyMilestones,
);

// Moderator / Admin

router.get(
  "/user/:userId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole("moderator", "admin"),
  MilestoneController.getUserMilestones,
);

// Admin

router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole("admin"),
  MilestoneController.createMilestone,
);

router.patch(
  "/:milestoneId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole("admin"),
  MilestoneController.updateMilestone,
);

router.delete(
  "/:milestoneId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole("admin"),
  MilestoneController.deleteMilestone,
);

export default router;
