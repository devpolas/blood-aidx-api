import { Router, type Router as ExpressRouter } from "express";
import { BloodRequestController } from "./blood-request.controller";
import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Public

router.get("/", BloodRequestController.getBloodRequests);
router.get("/:requestId", BloodRequestController.getBloodRequestById);

// Authenticated

router.get(
  "/",
  protect,
  requireActiveUser,
  BloodRequestController.getMyBloodRequests,
);

router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.createBloodRequest,
);

router.patch(
  "/:requestId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.updateBloodRequest,
);

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

router.delete(
  "/:requestId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  BloodRequestController.deleteBloodRequest,
);

export default router;
