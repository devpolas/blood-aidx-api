import { Router, type Router as ExpressRouter } from "express";
import { BloodRequestResponseController } from "./blood-request-response.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Authenticated Routes

router.use(protect, requireActiveUser);

// Current User

// Get my responses
router.get("/me", BloodRequestResponseController.getMyResponses);

// Blood Request

// Create response for a blood request
router.post(
  "/requests/:requestId",
  requireVerifiedEmail,
  BloodRequestResponseController.createResponse,
);

// Get responses for a blood request
// Request owner + moderator/admin are authorized
// inside the service.
router.get(
  "/requests/:requestId",
  BloodRequestResponseController.getResponsesForRequest,
);

// Individual Response

// Get individual response
// Donor + requester + moderator/admin
router.get("/:responseId", BloodRequestResponseController.getResponseById);

// Update response status
router.patch(
  "/:responseId/status",
  requireVerifiedEmail,
  BloodRequestResponseController.updateResponseStatus,
);

// Donor cancels own response
router.post(
  "/:responseId/cancel",
  requireVerifiedEmail,
  BloodRequestResponseController.cancelMyResponse,
);

// Donor deletes own response
router.delete(
  "/:responseId",
  requireVerifiedEmail,
  BloodRequestResponseController.deleteMyResponse,
);

export default router;
