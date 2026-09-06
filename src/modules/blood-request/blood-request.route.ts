import { Router, type Router as ExpressRouter } from "express";
import { BloodRequestController } from "./blood-request.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Public Routes

// Get all blood requests
router.get("/", BloodRequestController.getBloodRequests);

// Get blood request by ID
router.get("/:requestId", BloodRequestController.getBloodRequestById);

// Authenticated Routes

// Get current user's blood requests
router.get(
  "/me",
  protect,
  requireActiveUser,
  BloodRequestController.getMyBloodRequests,
);

// Create blood request
router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.createBloodRequest,
);

// Update blood request
router.patch(
  "/:requestId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.updateBloodRequest,
);

// Update blood request status
router.patch(
  "/:requestId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.updateBloodRequestStatus,
);

// Cancel blood request
router.post(
  "/:requestId/cancel",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.cancelBloodRequest,
);

// Delete blood request
router.delete(
  "/:requestId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.deleteBloodRequest,
);

export default router;
