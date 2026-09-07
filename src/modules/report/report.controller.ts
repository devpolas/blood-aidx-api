import type { Request, Response } from "express";

import httpStatus from "http-status";

import { CreateReportSchema, UpdateReportStatusSchema } from "./report.schema";

import { ReportService } from "./report.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// Create

const createReport = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = CreateReportSchema.parse(req.body);

  const result = await ReportService.createReport(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Report submitted successfully",
    data: result,
  });
});

// My reports

const getMyReports = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await ReportService.getMyReports(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reports retrieved successfully",
    data: result,
  });
});

// Get report

const getReport = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await ReportService.getReportForUser(
    req.params.reportId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report retrieved successfully",
    data: result,
  });
});

// Update status

const updateReportStatus = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = UpdateReportStatusSchema.parse(req.body);

  const result = await ReportService.updateReportStatus(
    req.params.reportId as string,
    user.id,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report status updated successfully",
    data: result,
  });
});

// Delete

const deleteReport = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await ReportService.deleteReport(req.params.reportId as string, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report deleted successfully",
  });
});

// Export

export const ReportController = {
  createReport,
  getMyReports,
  getReport,
  updateReportStatus,
  deleteReport,
};
