import { Router, type Router as ExpressRouter } from "express";
import { MilestoneController } from "./milestone.controller";
import {
  protect,
  requireActiveUser,
  requireRole,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Current User

router.get(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MilestoneController.getMyMilestones,
);

// User Milestones

router.get("/user/:userId", MilestoneController.getUserMilestones);

// Public

router.get("/", MilestoneController.getMilestones);
router.get("/:milestoneId", MilestoneController.getMilestoneById);

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
