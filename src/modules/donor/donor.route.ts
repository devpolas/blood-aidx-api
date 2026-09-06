import { Router, type Router as ExpressRouter } from "express";

import { DonorController } from "./donor.controller";

import { protect, requireActiveUser } from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Donor Discovery

router.get("/", DonorController.getDonors);
router.get("/:donorId", DonorController.getDonorById);

// My Donor Profile

router.get("/", protect, requireActiveUser, DonorController.getMyDonorProfile);

router.put(
  "/",
  protect,
  requireActiveUser,
  DonorController.upsertMyDonorProfile,
);

router.delete(
  "/",
  protect,
  requireActiveUser,
  DonorController.deleteMyDonorProfile,
);

export default router;
