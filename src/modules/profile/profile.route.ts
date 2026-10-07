import { Router, type Router as ExpressRouter } from "express";

import { ProfileController } from "./profile.controller";
import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// My Profile
router.get("/me", protect, requireActiveUser, ProfileController.getMyProfile);

router.put(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ProfileController.upsertMyProfile,
);

router.delete(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ProfileController.deleteMyProfile,
);

// Public
router.get("/:userId", ProfileController.getProfileByUserId);

// Moderator / Admin
router.patch(
  "/:userId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ProfileController.updateProfileByUserId,
);

router.delete(
  "/:userId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ProfileController.deleteProfileByUserId,
);

export default router;
