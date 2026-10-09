import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  CreateReportInput,
  ReportQueryInput,
  UpdateReportStatusInput,
} from "./report.schema";

type ReportType = CreateReportInput["type"];

// Helpers

const getReportById = async (reportId: string) => {
  const report = await db.orm.public.Report.where({
    id: reportId,
  }).first();

  if (!report) {
    throw new AppError("Report not found", httpStatus.NOT_FOUND);
  }

  return report;
};

const validateReportTarget = async (
  reporterId: string,
  type: ReportType,
  targetId: string,
) => {
  switch (type) {
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

    case "donation": {
      const donation = await db.orm.public.BloodDonation.where({
        id: targetId,
      }).first();

      if (!donation) {
        throw new AppError("Reported donation not found", httpStatus.NOT_FOUND);
      }

      // Donor can report their own donation.
      if (donation.donorId === reporterId) {
        return;
      }

      // Blood request owner can report a related donation.
      if (donation.requestId) {
        const request = await db.orm.public.BloodRequest.where({
          id: donation.requestId,
        }).first();

        if (request?.requesterId === reporterId) {
          return;
        }
      }

      throw new AppError(
        "You are not authorized to report this donation",
        httpStatus.FORBIDDEN,
      );
    }

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

    case "message": {
      const message = await db.orm.public.Message.where({
        id: targetId,
      }).first();

      if (!message) {
        throw new AppError("Reported message not found", httpStatus.NOT_FOUND);
      }

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

// List

const getReportList = async (
  query: ReportQueryInput,
  filters: {
    reporterId?: string;
  } = {},
) => {
  let reportQuery = db.orm.public.Report;

  // Filters
  const reporterId = filters.reporterId ?? query.reporterId;

  if (reporterId) {
    reportQuery = reportQuery.where({ reporterId });
  }

  if (query.type) {
    reportQuery = reportQuery.where({ type: query.type });
  }

  if (query.status) {
    reportQuery = reportQuery.where({ status: query.status });
  }

  if (query.targetId) {
    reportQuery = reportQuery.where({ targetId: query.targetId });
  }

  if (query.createdAtFrom) {
    reportQuery = reportQuery.where((report) =>
      report.createdAt.gte(query.createdAtFrom!),
    );
  }

  if (query.createdAtTo) {
    reportQuery = reportQuery.where((report) =>
      report.createdAt.lte(query.createdAtTo!),
    );
  }

  // Count
  const totalResult = await reportQuery.aggregate((report) => ({
    total: report.count(),
  }));

  const total = totalResult.total;

  // Sorting
  const ascending = query.sortOrder === "asc";

  let sortedQuery = reportQuery;

  switch (query.sortBy) {
    case "updatedAt":
      sortedQuery = reportQuery.orderBy((report) =>
        ascending ? report.updatedAt.asc() : report.updatedAt.desc(),
      );
      break;

    case "status":
      sortedQuery = reportQuery.orderBy((report) =>
        ascending ? report.status.asc() : report.status.desc(),
      );
      break;

    case "type":
      sortedQuery = reportQuery.orderBy((report) =>
        ascending ? report.type.asc() : report.type.desc(),
      );
      break;

    case "createdAt":
    default:
      sortedQuery = reportQuery.orderBy((report) =>
        ascending ? report.createdAt.asc() : report.createdAt.desc(),
      );
      break;
  }

  // Pagination
  const data = await sortedQuery
    .offset((query.page - 1) * query.limit)
    .limit(query.limit)
    .all();

  const totalPage = Math.ceil(total / query.limit);

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPage,
      hasNextPage: query.page < totalPage,
      hasPreviousPage: query.page > 1 && totalPage > 0,
    },
  };
};

// Create

const createReport = async (reporterId: string, data: CreateReportInput) => {
  await validateReportTarget(reporterId, data.type, data.targetId);

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
    resolvedAt: null,
  });
};

// User

const getMyReports = async (reporterId: string, query: ReportQueryInput) => {
  return getReportList(query, {
    reporterId,
  });
};

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

// Moderation

const getReports = async (query: ReportQueryInput) => {
  return getReportList(query);
};

const updateReportStatus = async (
  reportId: string,
  moderatorId: string,
  data: UpdateReportStatusInput,
) => {
  const report = await getReportById(reportId);

  if (report.status === "resolved" || report.status === "rejected") {
    throw new AppError(
      "This report has already been finalized",
      httpStatus.BAD_REQUEST,
    );
  }

  // pending → reviewing

  if (report.status === "pending" && data.status === "reviewing") {
    return db.orm.public.Report.where({
      id: reportId,
    }).update({
      status: "reviewing",
      resolvedById: null,
      resolvedAt: null,
    });
  }

  // reviewing → resolved

  if (report.status === "reviewing" && data.status === "resolved") {
    return db.orm.public.Report.where({
      id: reportId,
    }).update({
      status: "resolved",
      resolvedById: moderatorId,
      resolvedAt: new Date().toDateString(),
    });
  }

  // reviewing → rejected

  if (report.status === "reviewing" && data.status === "rejected") {
    return db.orm.public.Report.where({
      id: reportId,
    }).update({
      status: "rejected",
      resolvedById: moderatorId,
      resolvedAt: new Date().toDateString(),
    });
  }

  throw new AppError(
    `Invalid report status transition: ${report.status} → ${data.status}`,
    httpStatus.BAD_REQUEST,
  );
};

// Delete

const deleteReport = async (reportId: string, reporterId: string) => {
  const report = await getReportById(reportId);

  if (report.reporterId !== reporterId) {
    throw new AppError(
      "Only the report owner can delete this report",
      httpStatus.FORBIDDEN,
    );
  }

  if (report.status !== "pending") {
    throw new AppError(
      "Only pending reports can be deleted",
      httpStatus.BAD_REQUEST,
    );
  }

  await db.orm.public.Report.where({
    id: reportId,
  }).delete();
};

export const ReportService = {
  createReport,
  getMyReports,
  getReportForUser,
  getReports,
  updateReportStatus,
  deleteReport,
};
