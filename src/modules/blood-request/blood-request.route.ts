import { Router, type Router as ExpressRouter } from "express";

import { BloodRequestController } from "./blood-request.controller";
import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Public
router.get("/", BloodRequestController.getBloodRequests);

// My Blood Requests
router.get(
  "/me",
  protect,
  requireActiveUser,
  BloodRequestController.getMyBloodRequests,
);

// Create Blood Request
router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.createBloodRequest,
);

// Update Blood Request Status
router.patch(
  "/:requestId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.updateBloodRequestStatus,
);

// Cancel Blood Request
router.post(
  "/:requestId/cancel",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.cancelBloodRequest,
);

// Update Blood Request
router.patch(
  "/:requestId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.updateBloodRequest,
);

// Delete Blood Request
router.delete(
  "/:requestId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.deleteBloodRequest,
);

// Get Blood Request by ID
router.get("/:requestId", BloodRequestController.getBloodRequestById);

export default router;
