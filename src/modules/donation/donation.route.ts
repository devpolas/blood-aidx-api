import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

import { DonationController } from "./donation.controller";

const router: ExpressRouter = Router();

// Authentication

router.use(protect, requireActiveUser);

// My Donations

router.get("/me", requireVerifiedEmail, DonationController.getMyDonations);

router.post("/", requireVerifiedEmail, DonationController.createDonation);

router.post(
  "/:donationId/cancel",
  requireVerifiedEmail,
  DonationController.cancelMyDonation,
);

// Donation Management

// Hospital / Blood Bank / Moderator / Admin
router.get("/", requireVerifiedEmail, DonationController.getDonations);

// Donor can only access their own donation
router.get(
  "/:donationId",
  requireVerifiedEmail,
  DonationController.getDonationById,
);

// Hospital / Blood Bank / Moderator / Admin
router.patch(
  "/:donationId/verify",
  requireVerifiedEmail,
  DonationController.verifyDonation,
);

export default router;
