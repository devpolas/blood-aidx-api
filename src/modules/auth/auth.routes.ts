import { Router, type Router as ExpressRouter } from "express";

import { AuthController } from "./auth.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// ============================================================
// Public Routes
// ============================================================

router.post("/signup", AuthController.signup);
router.post("/signin", AuthController.signin);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/resend-verification", AuthController.resendVerification);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// ============================================================
// Protected Routes
// ============================================================

router.get("/me", protect, AuthController.me);
router.post("/fresh-token", AuthController.freshToken);
router.post("/logout", protect, AuthController.logout);
router.post("/logout-all", protect, AuthController.logoutAll);
router.post(
  "/logout-other-devices",
  protect,
  AuthController.logoutOtherDevices,
);

// ============================================================
// Protected + Active + Verified
// ============================================================

router.post(
  "/verify-password",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  AuthController.verifyPassword,
);

router.post(
  "/change-password",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  AuthController.changePassword,
);

export default router;
