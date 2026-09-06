import { Router, type Router as ExpressRouter } from "express";
import { ProfileController } from "./profile.controller";
import { protect, requireActiveUser } from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

router.get("/", protect, requireActiveUser, ProfileController.getMyProfile);

router.put("/", protect, requireActiveUser, ProfileController.upsertMyProfile);

router.delete(
  "/",
  protect,
  requireActiveUser,
  ProfileController.deleteMyProfile,
);

export default router;
