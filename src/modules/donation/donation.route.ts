import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";
import { DonationController } from "./donation.controller";

const router: ExpressRouter = Router();

// Public Donor Profile

router.get("/donor/:donorId", DonationController.getDonorDonations);

// My Donations

// IMPORTANT: /me must come before /:donationId

router.get(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonationController.getMyDonations,
);

router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonationController.createDonation,
);

router.post(
  "/:donationId/cancel",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonationController.cancelMyDonation,
);

// Donation Detail

router.get(
  "/:donationId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonationController.getDonationById,
);

// Moderator / Admin

router.get(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonationController.getDonations,
);

router.patch(
  "/:donationId/verify",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonationController.verifyDonation,
);

export default router;
