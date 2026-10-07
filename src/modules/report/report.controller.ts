import type { Request, Response } from "express";
import httpStatus from "http-status";

import {
  CreateReportSchema,
  ReportQuerySchema,
  UpdateReportStatusSchema,
} from "./report.schema";
import { ReportService } from "./report.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// User

const createReport = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = CreateReportSchema.parse(req.body);

  const report = await ReportService.createReport(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Report submitted successfully",
    data: report,
  });
});

const getMyReports = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const query = ReportQuerySchema.parse(req.query);

  const reports = await ReportService.getMyReports(user.id, query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your reports retrieved successfully",
    data: reports.data,
    meta: reports.meta,
  });
});

const getReport = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const reportId = req.params.reportId as string;

  const report = await ReportService.getReportForUser(reportId, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report retrieved successfully",
    data: report,
  });
});

const deleteReport = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const reportId = req.params.reportId as string;

  await ReportService.deleteReport(reportId, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report deleted successfully",
    data: null,
  });
});

// Moderation

const getReports = catchAsync(async (req: Request, res: Response) => {
  const query = ReportQuerySchema.parse(req.query);

  const reports = await ReportService.getReports(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reports retrieved successfully",
    data: reports.data,
    meta: reports.meta,
  });
});

const updateReportStatus = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const reportId = req.params.reportId as string;

  const data = UpdateReportStatusSchema.parse(req.body);

  const report = await ReportService.updateReportStatus(
    reportId,
    user.id,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report status updated successfully",
    data: report,
  });
});

export const ReportController = {
  createReport,
  getMyReports,
  getReport,
  deleteReport,
  getReports,
  updateReportStatus,
};
