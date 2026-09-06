import { Router, type Router as ExpressRouter } from "express";

import { ProfileController } from "./profile.controller";

import { protect, requireActiveUser } from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

router.get("/me", protect, requireActiveUser, ProfileController.getMyProfile);

router.put(
  "/me",
  protect,
  requireActiveUser,
  ProfileController.upsertMyProfile,
);

router.delete(
  "/me",
  protect,
  requireActiveUser,
  ProfileController.deleteMyProfile,
);

export default router;
