import { Router } from "express";

import {
  protect,
  requireActiveUser,
  requireAdmin,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";
import { PaymentController } from "./payment.controller";

const router = Router();

// User

router.post(
  "/coffee",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  PaymentController.createCoffeePayment,
);

router.get(
  "/my",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  PaymentController.getMyPayments,
);

router.get(
  "/donor/:donorId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  PaymentController.getDonorPayments,
);

// Admin

router.get(
  "/admin/:paymentId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireAdmin,
  PaymentController.getPaymentForAdmin,
);

router.post(
  "/admin/:paymentId/refund",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireAdmin,
  PaymentController.refundPayment,
);

// Generic Payment

router.get(
  "/:paymentId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  PaymentController.getPayment,
);

export default router;
