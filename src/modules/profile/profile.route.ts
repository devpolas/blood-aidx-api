import { Router, type Router as ExpressRouter } from "express";

import { ProfileController } from "./profile.controller";

import { protect, requireActiveUser } from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// My Profile

router.get("/me", protect, requireActiveUser, ProfileController.getMyProfile);

router.post(
  "/me",
  protect,
  requireActiveUser,
  ProfileController.createMyProfile,
);

router.patch(
  "/me",
  protect,
  requireActiveUser,
  ProfileController.updateMyProfile,
);

router.delete(
  "/me",
  protect,
  requireActiveUser,
  ProfileController.deleteMyProfile,
);

export default router;
