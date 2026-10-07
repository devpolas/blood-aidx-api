import { Router, type Router as ExpressRouter } from "express";

import { ReportController } from "./report.controller";

import {
  protect,
  requireActiveUser,
  requireRole,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Moderation
router.get(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole("moderator", "admin"),
  ReportController.getReports,
);

router.patch(
  "/:reportId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole("moderator", "admin"),
  ReportController.updateReportStatus,
);

// Current User
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

// Individual Report
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

export default router;
