import { Router, type Router as ExpressRouter } from "express";

import { BloodRequestResponseController } from "./blood-request-response.controller";
import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Current User
router.get(
  "/me",
  protect,
  requireActiveUser,
  BloodRequestResponseController.getMyResponses,
);

// Blood Request
router.post(
  "/requests/:requestId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestResponseController.createResponse,
);

router.get(
  "/requests/:requestId",
  protect,
  requireActiveUser,
  BloodRequestResponseController.getResponsesForRequest,
);

// Individual Response
router.get(
  "/:responseId",
  protect,
  requireActiveUser,
  BloodRequestResponseController.getResponseById,
);

router.patch(
  "/:responseId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestResponseController.updateResponseStatus,
);

router.post(
  "/:responseId/cancel",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestResponseController.cancelMyResponse,
);

router.delete(
  "/:responseId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestResponseController.deleteMyResponse,
);

export default router;
