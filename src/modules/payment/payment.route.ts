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

router.get("/my", protect, requireActiveUser, PaymentController.getMyPayments);

router.get("/donor/:donorId", protect, PaymentController.getDonorPayments);

// Admin

router.get(
  "/admin/:paymentId",
  protect,
  requireActiveUser,
  requireAdmin,
  PaymentController.getPaymentForAdmin,
);

router.post(
  "/admin/:paymentId/refund",
  protect,
  requireActiveUser,
  requireAdmin,
  PaymentController.refundPayment,
);

// Generic payment

router.get(
  "/:paymentId",
  protect,
  requireActiveUser,
  PaymentController.getPayment,
);

export default router;
