import { Router, type Router as ExpressRouter } from "express";

import { ProfileController } from "./profile.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Authentication

router.use(protect, requireActiveUser);

// My Profile

// IMPORTANT: /me must come before /:userId

router.get("/me", ProfileController.getMyProfile);
router.put("/me", requireVerifiedEmail, ProfileController.upsertMyProfile);
router.delete("/me", requireVerifiedEmail, ProfileController.deleteMyProfile);

// Moderator / Admin

// Get another user's profile
// Authorization is handled inside the service:
// Moderator + Admin

router.get("/:userId", ProfileController.getProfileByUserId);

// Update another user's profile
// Authorization is handled inside the service:
// Moderator + Admin

router.patch(
  "/:userId",
  requireVerifiedEmail,
  ProfileController.updateProfileByUserId,
);

// Delete another user's profile
// Authorization is handled inside the service:
// Admin only

router.delete(
  "/:userId",
  requireVerifiedEmail,
  ProfileController.deleteProfileByUserId,
);

export default router;
