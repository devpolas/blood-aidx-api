import httpStatus from "http-status";

import type {
  BloodRequestQueryInput,
  CreateBloodRequestInput,
  UpdateBloodRequestInput,
  UpdateBloodRequestStatusInput,
} from "./blood-request.schema";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

type BloodRequestActorRole = "user" | "moderator" | "admin";

const TERMINAL_STATUSES = ["fulfilled", "cancelled", "expired"] as const;

const getActor = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

const getBloodRequestById = async (requestId: string) => {
  const request = await db.orm.public.BloodRequest.where({
    id: requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  return request;
};

const isModerator = (role: BloodRequestActorRole) => {
  return role === "moderator" || role === "admin";
};

const requireOwnerOrModerator = async (
  userId: string,
  request: {
    requesterId: string;
  },
) => {
  const actor = await getActor(userId);

  const isOwner = request.requesterId === userId;

  const canModerate = isModerator(actor.role as BloodRequestActorRole);

  if (!isOwner && !canModerate) {
    throw new AppError(
      "You are not allowed to modify this blood request",
      httpStatus.FORBIDDEN,
    );
  }

  return {
    actor,
    isOwner,
    canModerate,
  };
};

const isTerminalStatus = (status: string) => {
  return TERMINAL_STATUSES.includes(
    status as (typeof TERMINAL_STATUSES)[number],
  );
};

const validateRequestCanBeUpdated = (status: string) => {
  if (!isTerminalStatus(status)) {
    return;
  }

  throw new AppError(
    "This blood request can no longer be updated",
    httpStatus.BAD_REQUEST,
  );
};

const validateStatusTransition = (
  currentStatus: string,
  nextStatus: string,
) => {
  if (isTerminalStatus(currentStatus) && currentStatus !== nextStatus) {
    throw new AppError(
      `A ${currentStatus} blood request cannot change status`,
      httpStatus.BAD_REQUEST,
    );
  }
};

const validateOwnerStatusChange = (
  isOwner: boolean,
  canModerate: boolean,
  nextStatus: string,
) => {
  if (isOwner && !canModerate && nextStatus !== "cancelled") {
    throw new AppError(
      "You can only cancel your blood request",
      httpStatus.FORBIDDEN,
    );
  }
};

const validateRequestDates = (
  requiredAt: string | null,
  expiresAt: string | null,
) => {
  if (requiredAt === null || expiresAt === null) {
    return;
  }

  if (new Date(expiresAt) <= new Date(requiredAt)) {
    throw new AppError(
      "Expiration time must be after required time",
      httpStatus.BAD_REQUEST,
    );
  }
};

const buildBloodRequestUpdateData = (data: UpdateBloodRequestInput) => {
  return {
    ...(data.locationId !== undefined && {
      locationId: data.locationId,
    }),

    ...(data.bloodGroup !== undefined && {
      bloodGroup: data.bloodGroup,
    }),

    ...(data.unitsRequired !== undefined && {
      unitsRequired: data.unitsRequired,
    }),

    ...(data.priority !== undefined && {
      priority: data.priority,
    }),

    ...(data.patientName !== undefined && {
      patientName: data.patientName,
    }),

    ...(data.hospitalName !== undefined && {
      hospitalName: data.hospitalName,
    }),

    ...(data.requiredAt !== undefined && {
      requiredAt: data.requiredAt,
    }),

    ...(data.expiresAt !== undefined && {
      expiresAt: data.expiresAt,
    }),

    ...(data.description !== undefined && {
      description: data.description,
    }),
  };
};

// Query Features

const buildBloodRequestFilters = (query: BloodRequestQueryInput) => {
  const filters: Record<string, unknown> = {};

  if (query.search) {
    filters.OR = [
      {
        patientName: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        hospitalName: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (query.bloodGroup) {
    filters.bloodGroup = query.bloodGroup;
  }

  if (query.priority) {
    filters.priority = query.priority;
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.locationId) {
    filters.locationId = query.locationId;
  }

  if (query.country || query.division || query.district || query.city) {
    filters.location = {
      ...(query.country && {
        country: query.country,
      }),

      ...(query.division && {
        division: query.division,
      }),

      ...(query.district && {
        district: query.district,
      }),

      ...(query.city && {
        city: query.city,
      }),
    };
  }

  if (query.requiredAtFrom || query.requiredAtTo) {
    filters.requiredAt = {
      ...(query.requiredAtFrom && {
        gte: query.requiredAtFrom,
      }),

      ...(query.requiredAtTo && {
        lte: query.requiredAtTo,
      }),
    };
  }

  if (query.expiresAtFrom || query.expiresAtTo) {
    filters.expiresAt = {
      ...(query.expiresAtFrom && {
        gte: query.expiresAtFrom,
      }),

      ...(query.expiresAtTo && {
        lte: query.expiresAtTo,
      }),
    };
  }

  if (query.createdAtFrom || query.createdAtTo) {
    filters.createdAt = {
      ...(query.createdAtFrom && {
        gte: query.createdAtFrom,
      }),

      ...(query.createdAtTo && {
        lte: query.createdAtTo,
      }),
    };
  }

  return filters;
};

const getBloodRequestList = async (
  query: BloodRequestQueryInput,
  requesterId?: string,
) => {
  const page = query.page;
  const limit = query.limit;
  const offset = (page - 1) * limit;

  const filters = buildBloodRequestFilters(query);

  if (requesterId) {
    filters.requesterId = requesterId;
  }

  const [requests, countResult] = await Promise.all([
    db.orm.public.BloodRequest.where(filters)
      .orderBy((bloodRequest) => {
        switch (query.sortBy) {
          case "updatedAt":
            return query.sortOrder === "asc"
              ? bloodRequest.updatedAt.asc()
              : bloodRequest.updatedAt.desc();

          case "requiredAt":
            return query.sortOrder === "asc"
              ? bloodRequest.requiredAt.asc()
              : bloodRequest.requiredAt.desc();

          case "expiresAt":
            return query.sortOrder === "asc"
              ? bloodRequest.expiresAt.asc()
              : bloodRequest.expiresAt.desc();

          case "unitsRequired":
            return query.sortOrder === "asc"
              ? bloodRequest.unitsRequired.asc()
              : bloodRequest.unitsRequired.desc();

          case "unitsFulfilled":
            return query.sortOrder === "asc"
              ? bloodRequest.unitsFulfilled.asc()
              : bloodRequest.unitsFulfilled.desc();

          case "priority":
            return query.sortOrder === "asc"
              ? bloodRequest.priority.asc()
              : bloodRequest.priority.desc();

          case "status":
            return query.sortOrder === "asc"
              ? bloodRequest.status.asc()
              : bloodRequest.status.desc();

          case "createdAt":
          default:
            return query.sortOrder === "asc"
              ? bloodRequest.createdAt.asc()
              : bloodRequest.createdAt.desc();
        }
      })
      .offset(offset)
      .limit(limit)
      .all(),

    db.orm.public.BloodRequest.where(filters).aggregate((aggregate) => ({
      total: aggregate.count(),
    })),
  ]);

  const total = countResult.total;

  const totalPage = Math.ceil(total / query.limit);

  return {
    data: requests,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPage,
      hasNextPage: query.page < totalPage,
      hasPreviousPage: query.page > 1,
    },
  };
};

// Get My Blood Requests

const getMyBloodRequests = async (
  userId: string,
  query: BloodRequestQueryInput,
) => {
  await getActor(userId);

  return getBloodRequestList(query, userId);
};

// Get All Blood Requests

const getBloodRequests = async (query: BloodRequestQueryInput) => {
  return getBloodRequestList(query);
};

// Create Blood Request

const createBloodRequest = async (
  userId: string,
  data: CreateBloodRequestInput,
) => {
  await getActor(userId);

  return db.orm.public.BloodRequest.create({
    requesterId: userId,

    ...(data.locationId !== undefined && {
      locationId: data.locationId,
    }),

    bloodGroup: data.bloodGroup,
    unitsRequired: data.unitsRequired,
    priority: data.priority,
    patientName: data.patientName,
    hospitalName: data.hospitalName,
    requiredAt: data.requiredAt,
    expiresAt: data.expiresAt,

    ...(data.description !== undefined && {
      description: data.description,
    }),
  });
};

// Update Blood Request

const updateBloodRequest = async (
  userId: string,
  requestId: string,
  data: UpdateBloodRequestInput,
) => {
  const request = await getBloodRequestById(requestId);

  const { isOwner } = await requireOwnerOrModerator(userId, request);

  if (isOwner) {
    validateRequestCanBeUpdated(request.status);
  }

  const requiredAt = data.requiredAt ?? request.requiredAt;

  const expiresAt = data.expiresAt ?? request.expiresAt;

  validateRequestDates(requiredAt, expiresAt);

  const updateData = buildBloodRequestUpdateData(data);

  return db.orm.public.BloodRequest.where({
    id: requestId,
  }).update(updateData);
};

// Update Blood Request Status

const updateBloodRequestStatus = async (
  userId: string,
  requestId: string,
  data: UpdateBloodRequestStatusInput,
) => {
  const request = await getBloodRequestById(requestId);

  const { isOwner, canModerate } = await requireOwnerOrModerator(
    userId,
    request,
  );

  validateStatusTransition(request.status, data.status);

  validateOwnerStatusChange(isOwner, canModerate, data.status);

  return db.orm.public.BloodRequest.where({
    id: requestId,
  }).update({
    status: data.status,
  });
};

// Cancel Blood Request

const cancelBloodRequest = async (userId: string, requestId: string) => {
  return updateBloodRequestStatus(userId, requestId, {
    status: "cancelled",
  });
};

// Delete Blood Request

const deleteBloodRequest = async (userId: string, requestId: string) => {
  const request = await getBloodRequestById(requestId);

  const actor = await getActor(userId);

  const actorRole = actor.role as BloodRequestActorRole;

  const isOwner = request.requesterId === userId;

  const canModerate = isModerator(actorRole);

  if (!isOwner && !canModerate) {
    throw new AppError(
      "You are not allowed to delete this blood request",
      httpStatus.FORBIDDEN,
    );
  }

  if (canModerate) {
    await db.orm.public.BloodRequest.where({
      id: requestId,
    }).delete();

    return null;
  }

  if (
    request.status === "partially_fulfilled" ||
    request.status === "fulfilled"
  ) {
    throw new AppError(
      "A fulfilled or partially fulfilled request cannot be deleted",
      httpStatus.BAD_REQUEST,
    );
  }

  if (request.status === "expired") {
    throw new AppError(
      "An expired blood request cannot be deleted",
      httpStatus.BAD_REQUEST,
    );
  }

  await db.orm.public.BloodRequest.where({
    id: requestId,
  }).delete();

  return null;
};

export const BloodRequestService = {
  getMyBloodRequests,
  getBloodRequests,
  getBloodRequestById,
  createBloodRequest,
  updateBloodRequest,
  updateBloodRequestStatus,
  cancelBloodRequest,
  deleteBloodRequest,
};
