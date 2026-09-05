import { Router, type Router as ExpressRouter } from "express";
import { AuthController } from "./auth.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Public Routes

// social auth handlers

router.get("/social/google", AuthController.googleSignIn);
router.get("/google/callback", AuthController.googleCallback);

// credential auth handlers

router.post("/signup", AuthController.signup);
router.post("/signin", AuthController.signin);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/resend-verification", AuthController.resendVerification);

// Password Recovery Routes
// Step 1: Send 6-digit OTP
// Step 2: Verify OTP and receive temporary reset token
// Step 3: Reset password using temporary reset token

router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-password-reset", AuthController.verifyPasswordReset);
router.post("/reset-password", AuthController.resetPassword);

// Protected Routes

router.get("/me", protect, AuthController.me);
router.post("/fresh-token", AuthController.freshToken);
router.post("/logout", protect, AuthController.logout);
router.post("/logout-all", protect, AuthController.logoutAll);
router.post(
  "/logout-other-devices",
  protect,
  AuthController.logoutOtherDevices,
);

// Protected + Active + Verified

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
