import { Router, type Router as ExpressRouter } from "express";
import { ReportController } from "./report.controller";
import {
  protect,
  requireActiveUser,
  requireRole,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// User

router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ReportController.createReport,
);

router.get(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ReportController.getMyReports,
);

router.get(
  "/:reportId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ReportController.getReport,
);

router.delete(
  "/:reportId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ReportController.deleteReport,
);

// Moderation

router.patch(
  "/:reportId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole("moderator", "admin"),
  ReportController.updateReportStatus,
);

export default router;
