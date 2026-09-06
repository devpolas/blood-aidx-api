import { Router, type Router as ExpressRouter } from "express";
import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole,
} from "../../middleware/auth.middleware";
import { DonationController } from "./donation.controller";

const router: ExpressRouter = Router();

const requireVerifier = requireRole(
  "hospital",
  "blood_bank",
  "moderator",
  "admin",
);

// Authenticated donor

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

// Individual donation

router.get(
  "/:donationId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  DonationController.getDonationById,
);

// Verification

router.patch(
  "/:donationId/verify",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireVerifier,
  DonationController.verifyDonation,
);

export default router;
