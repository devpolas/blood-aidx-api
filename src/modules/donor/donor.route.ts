import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

import { DonorController } from "./donor.controller";

const router: ExpressRouter = Router();

// Current User
router.get(
  "/me",
  protect,
  requireActiveUser,
  DonorController.getMyDonorProfile,
);

router.put(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonorController.upsertMyDonorProfile,
);

router.delete(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonorController.deleteMyDonorProfile,
);

// Public Donor Discovery
router.get("/", DonorController.getDonors);

router.get("/:donorId", DonorController.getDonorById);

// Moderator / Admin
router.patch(
  "/:donorId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonorController.updateDonorProfileById,
);

router.delete(
  "/:donorId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonorController.deleteDonorProfileById,
);

export default router;
