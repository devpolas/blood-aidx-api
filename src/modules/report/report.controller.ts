import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { CreateReportSchema, UpdateReportStatusSchema } from "./report.schema";
import { ReportService } from "./report.service";
import { requireAuth } from "../../middleware/auth.middleware";

// Create

const createReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = CreateReportSchema.parse(req.body);

    const result = await ReportService.createReport(user.id, data);

    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Report submitted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// My reports

const getMyReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await ReportService.getMyReports(user.id);

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get report

const getReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = requireAuth(req);

    const result = await ReportService.getReportForUser(
      req.params.reportId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update status

const updateReportStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = UpdateReportStatusSchema.parse(req.body);

    const result = await ReportService.updateReportStatus(
      req.params.reportId as string,
      user.id,
      data,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Report status updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Delete

const deleteReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    await ReportService.deleteReport(req.params.reportId as string, user.id);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Export

export const ReportController = {
  createReport,
  getMyReports,
  getReport,
  updateReportStatus,
  deleteReport,
};
