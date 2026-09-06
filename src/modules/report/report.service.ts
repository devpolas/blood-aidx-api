import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  CreateReportInput,
  UpdateReportStatusInput,
} from "./report.schema";

// Get report

const getReportById = async (reportId: string) => {
  const report = await db.orm.public.Report.where({
    id: reportId,
  }).first();

  if (!report) {
    throw new AppError("Report not found", httpStatus.NOT_FOUND);
  }

  return report;
};

// Validate target

const validateReportTarget = async (
  reporterId: string,
  type: CreateReportInput["type"],
  targetId: string,
) => {
  switch (type) {
    // User
    case "user": {
      if (reporterId === targetId) {
        throw new AppError(
          "You cannot report yourself",
          httpStatus.BAD_REQUEST,
        );
      }

      const user = await db.orm.public.User.where({
        id: targetId,
      }).first();

      if (!user) {
        throw new AppError("Reported user not found", httpStatus.NOT_FOUND);
      }

      return;
    }

    // Blood request
    case "blood_request": {
      const request = await db.orm.public.BloodRequest.where({
        id: targetId,
      }).first();

      if (!request) {
        throw new AppError(
          "Reported blood request not found",
          httpStatus.NOT_FOUND,
        );
      }

      return;
    }

    // Donation
    case "donation": {
      const donation = await db.orm.public.BloodDonation.where({
        id: targetId,
      }).first();

      if (!donation) {
        throw new AppError("Reported donation not found", httpStatus.NOT_FOUND);
      }

      return;
    }

    // Organization
    case "organization": {
      const organization = await db.orm.public.Organization.where({
        id: targetId,
      }).first();

      if (!organization) {
        throw new AppError(
          "Reported organization not found",
          httpStatus.NOT_FOUND,
        );
      }

      return;
    }

    // Message
    case "message": {
      const message = await db.orm.public.Message.where({
        id: targetId,
      }).first();

      if (!message) {
        throw new AppError("Reported message not found", httpStatus.NOT_FOUND);
      }

      // Reporter must belong to the conversation.
      const participant = await db.orm.public.ConversationParticipant.where({
        conversationId: message.conversationId,
        userId: reporterId,
      }).first();

      if (!participant) {
        throw new AppError(
          "You cannot report a message from a conversation you are not part of",
          httpStatus.FORBIDDEN,
        );
      }

      return;
    }

    // Review
    case "review": {
      const review = await db.orm.public.Review.where({
        id: targetId,
      }).first();

      if (!review) {
        throw new AppError("Reported review not found", httpStatus.NOT_FOUND);
      }

      return;
    }
  }
};

// Create report

const createReport = async (reporterId: string, data: CreateReportInput) => {
  await validateReportTarget(reporterId, data.type, data.targetId);

  // Prevent duplicate active reports for
  // the same target by the same reporter.
  const existingReports = await db.orm.public.Report.where({
    reporterId,
    type: data.type,
    targetId: data.targetId,
  }).all();

  const activeReport = existingReports.find(
    (report) => report.status === "pending" || report.status === "reviewing",
  );

  if (activeReport) {
    throw new AppError(
      "You already have an active report for this target",
      httpStatus.CONFLICT,
    );
  }

  return db.orm.public.Report.create({
    reporterId,
    type: data.type,
    targetId: data.targetId,
    reason: data.reason,
    description: data.description ?? null,
    status: "pending",
    resolvedById: null,
  });
};

// My reports

const getMyReports = async (reporterId: string) => {
  return db.orm.public.Report.where({
    reporterId,
  }).all();
};

// Get report for reporter

const getReportForUser = async (reportId: string, userId: string) => {
  const report = await getReportById(reportId);

  if (report.reporterId !== userId) {
    throw new AppError(
      "You do not have access to this report",
      httpStatus.FORBIDDEN,
    );
  }

  return report;
};

// Update report status

const updateReportStatus = async (
  reportId: string,
  moderatorId: string,
  data: UpdateReportStatusInput,
) => {
  const report = await getReportById(reportId);

  // Status transition validation

  if (report.status === "resolved" || report.status === "rejected") {
    if (data.status === "pending") {
      throw new AppError(
        "A resolved or rejected report cannot be moved back to pending",
        httpStatus.BAD_REQUEST,
      );
    }
  }

  if (report.status === "pending" && data.status === "resolved") {
    throw new AppError(
      "Report must be reviewed before resolving",
      httpStatus.BAD_REQUEST,
    );
  }

  // Reviewing

  if (data.status === "reviewing") {
    return db.orm.public.Report.where({
      id: reportId,
    }).update({
      status: "reviewing",
      resolvedById: moderatorId,
    });
  }

  // Resolved

  if (data.status === "resolved") {
    return db.orm.public.Report.where({
      id: reportId,
    }).update({
      status: "resolved",
      resolvedById: moderatorId,
    });
  }

  // Rejected

  if (data.status === "rejected") {
    return db.orm.public.Report.where({
      id: reportId,
    }).update({
      status: "rejected",
      resolvedById: moderatorId,
    });
  }

  // Pending

  return db.orm.public.Report.where({
    id: reportId,
  }).update({
    status: "pending",
    resolvedById: null,
  });
};

// Delete own report

const deleteReport = async (reportId: string, reporterId: string) => {
  const report = await getReportById(reportId);

  if (report.reporterId !== reporterId) {
    throw new AppError(
      "Only the report owner can delete this report",
      httpStatus.FORBIDDEN,
    );
  }

  if (report.status === "resolved" || report.status === "rejected") {
    throw new AppError(
      "Resolved or rejected reports cannot be deleted",
      httpStatus.BAD_REQUEST,
    );
  }

  await db.orm.public.Report.where({
    id: reportId,
  }).delete();
};

// Export

export const ReportService = {
  createReport,
  getMyReports,
  getReportForUser,
  updateReportStatus,
  deleteReport,
};
