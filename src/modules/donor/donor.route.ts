import { Router, type Router as ExpressRouter } from "express";

import { DonorController } from "./donor.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Authenticated Donor Routes

router.use(protect, requireActiveUser);

// My Donor Profile
// IMPORTANT: /me must come before /:donorId

router.get("/me", DonorController.getMyDonorProfile);
router.put("/me", requireVerifiedEmail, DonorController.upsertMyDonorProfile);

router.delete(
  "/me",
  requireVerifiedEmail,
  DonorController.deleteMyDonorProfile,
);

// Donor Discovery

router.get("/", DonorController.getDonors);
router.get("/:donorId", DonorController.getDonorById);

// Moderator / Admin

router.patch(
  "/:donorId",
  requireVerifiedEmail,
  DonorController.updateDonorProfileById,
);

router.delete(
  "/:donorId",
  requireVerifiedEmail,
  DonorController.deleteDonorProfileById,
);

export default router;
