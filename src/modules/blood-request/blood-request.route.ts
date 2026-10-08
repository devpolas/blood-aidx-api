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

router.get("/:requestId", BloodRequestController.getBloodRequestById);

// Current User

router.get(
  "/me",
  protect,
  requireActiveUser,
  BloodRequestController.getMyBloodRequests,
);

// Create

router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.createBloodRequest,
);

// Actions

router.patch(
  "/:requestId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.updateBloodRequestStatus,
);

router.post(
  "/:requestId/cancel",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.cancelBloodRequest,
);

// Update

router.patch(
  "/:requestId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.updateBloodRequest,
);

// Delete

router.delete(
  "/:requestId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.deleteBloodRequest,
);

export default router;
