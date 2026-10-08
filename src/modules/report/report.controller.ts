import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import {
  CreateReportSchema,
  ReportQuerySchema,
  UpdateReportStatusSchema,
} from "./report.schema";

import { ReportService } from "./report.service";

export const ReportController = {
  // User

  createReport: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = CreateReportSchema.parse(req.body);

    const report = await ReportService.createReport(user.id, data);

    sendResponse(res, {
      success: true,
      message: "Report submitted successfully",
      statusCode: httpStatus.CREATED,
      data: { report },
    });
  }),

  getMyReports: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const query = ReportQuerySchema.parse(req.query);

    const result = await ReportService.getMyReports(user.id, query);

    sendResponse(res, {
      success: true,
      message: "Your reports retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        reports: result.data,
      },
      meta: result.meta,
    });
  }),

  getReport: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const report = await ReportService.getReportForUser(
      req.params.reportId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Report retrieved successfully",
      statusCode: httpStatus.OK,
      data: { report },
    });
  }),

  deleteReport: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await ReportService.deleteReport(req.params.reportId as string, user.id);

    sendResponse(res, {
      success: true,
      message: "Report deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  // Moderation

  getReports: catchAsync(async (req: Request, res: Response) => {
    const query = ReportQuerySchema.parse(req.query);

    const result = await ReportService.getReports(query);

    sendResponse(res, {
      success: true,
      message: "Reports retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        reports: result.data,
      },
      meta: result.meta,
    });
  }),

  updateReportStatus: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateReportStatusSchema.parse(req.body);

    const report = await ReportService.updateReportStatus(
      req.params.reportId as string,
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Report status updated successfully",
      statusCode: httpStatus.OK,
      data: { report },
    });
  }),
};
