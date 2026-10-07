import { Router, type Router as ExpressRouter } from "express";

import { ReportController } from "./report.controller";

import {
  protect,
  requireActiveUser,
  requireRole,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Authentication

router.use(protect, requireActiveUser);

// Moderation

router.get(
  "/",
  requireVerifiedEmail,
  requireRole("moderator", "admin"),
  ReportController.getReports,
);

router.patch(
  "/:reportId/status",
  requireVerifiedEmail,
  requireRole("moderator", "admin"),
  ReportController.updateReportStatus,
);

// User

router.post("/", requireVerifiedEmail, ReportController.createReport);

// IMPORTANT:
// /me must be declared before /:reportId.

router.get("/me", requireVerifiedEmail, ReportController.getMyReports);

router.get("/:reportId", requireVerifiedEmail, ReportController.getReport);

router.delete(
  "/:reportId",
  requireVerifiedEmail,
  ReportController.deleteReport,
);

export default router;
