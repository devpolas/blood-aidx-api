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
const ORGANIZATION_TYPES = ["hospital", "blood_bank"] as const;
const ACTIVE_ORGANIZATION_STATUSES = ["active", "verified"] as const;

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

const getOrganizationForBloodRequest = async (organizationId: string) => {
  const organization = await db.orm.public.Organization.where({
    id: organizationId,
  }).first();

  if (!organization) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  if (
    !ORGANIZATION_TYPES.includes(
      organization.type as (typeof ORGANIZATION_TYPES)[number],
    )
  ) {
    throw new AppError(
      "Blood requests can only be associated with a hospital or blood bank",
      httpStatus.BAD_REQUEST,
    );
  }

  if (
    !ACTIVE_ORGANIZATION_STATUSES.includes(
      organization.status as (typeof ACTIVE_ORGANIZATION_STATUSES)[number],
    )
  ) {
    throw new AppError(
      "This organization is not available for blood requests",
      httpStatus.BAD_REQUEST,
    );
  }

  return organization;
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
  requiredAt: string | null | undefined,
  expiresAt: string | null | undefined,
) => {
  if (!requiredAt || !expiresAt) {
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
    ...(data.organizationId !== undefined && {
      organizationId: data.organizationId,
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

    ...(data.patientAge !== undefined && {
      patientAge: data.patientAge,
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
// Blood Request Filters

const buildBloodRequestFilters = async (
  query: BloodRequestQueryInput,
  requesterId?: string,
) => {
  let filteredQuery = db.orm.public.BloodRequest;

  if (query.bloodGroup) {
    filteredQuery = filteredQuery.where({
      bloodGroup: query.bloodGroup,
    });
  }

  if (query.priority) {
    filteredQuery = filteredQuery.where({
      priority: query.priority,
    });
  }

  if (query.status) {
    filteredQuery = filteredQuery.where({
      status: query.status,
    });
  }

  if (query.organizationId) {
    filteredQuery = filteredQuery.where({
      organizationId: query.organizationId,
    });
  }

  if (requesterId) {
    filteredQuery = filteredQuery.where({
      requesterId,
    });
  }

  const country = query.country;
  const division = query.division;
  const city = query.city;

  if (country || division || city) {
    const locations = await db.orm.public.Location.where({
      ...(country && { country }),
      ...(division && { division }),
      ...(city && { city }),
    })
      .select("id")
      .all();

    if (locations.length === 0) {
      return null;
    }

    const locationIds = locations.map((location) => location.id);

    const organizations = await db.orm.public.Organization.where(
      (organization) => organization.locationId.in(locationIds),
    )
      .select("id")
      .all();

    const organizationIds = organizations.map(
      (organization) => organization.id,
    );

    if (organizationIds.length === 0) {
      return null;
    }

    filteredQuery = filteredQuery.where((bloodRequest) =>
      bloodRequest.organizationId.in(organizationIds),
    );
  }

  const search = query.search;

  if (search) {
    const matchingOrganizations = await db.orm.public.Organization.where(
      (organization) => organization.name.ilike(`%${search}%`),
    )
      .select("id")
      .all();

    const organizationIds = matchingOrganizations.map(
      (organization) => organization.id,
    );

    filteredQuery = filteredQuery.where(
      (bloodRequest) =>
        bloodRequest.patientName.ilike(`%${search}%`) ||
        bloodRequest.description.ilike(`%${search}%`) ||
        bloodRequest.organizationId.in(organizationIds),
    );
  }

  const requiredAtFrom = query.requiredAtFrom;
  const requiredAtTo = query.requiredAtTo;
  const expiresAtFrom = query.expiresAtFrom;
  const expiresAtTo = query.expiresAtTo;
  const createdAtFrom = query.createdAtFrom;
  const createdAtTo = query.createdAtTo;

  if (requiredAtFrom) {
    filteredQuery = filteredQuery.where((bloodRequest) =>
      bloodRequest.requiredAt.gte(requiredAtFrom),
    );
  }

  if (requiredAtTo) {
    filteredQuery = filteredQuery.where((bloodRequest) =>
      bloodRequest.requiredAt.lte(requiredAtTo),
    );
  }

  if (expiresAtFrom) {
    filteredQuery = filteredQuery.where((bloodRequest) =>
      bloodRequest.expiresAt.gte(expiresAtFrom),
    );
  }

  if (expiresAtTo) {
    filteredQuery = filteredQuery.where((bloodRequest) =>
      bloodRequest.expiresAt.lte(expiresAtTo),
    );
  }

  if (createdAtFrom) {
    filteredQuery = filteredQuery.where((bloodRequest) =>
      bloodRequest.createdAt.gte(createdAtFrom),
    );
  }

  if (createdAtTo) {
    filteredQuery = filteredQuery.where((bloodRequest) =>
      bloodRequest.createdAt.lte(createdAtTo),
    );
  }

  return filteredQuery;
};

// Blood Request List

const getBloodRequestList = async (
  query: BloodRequestQueryInput,
  requesterId?: string,
) => {
  const filteredQuery = await buildBloodRequestFilters(query, requesterId);

  if (!filteredQuery) {
    return {
      data: [],
      meta: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPage: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const offset = (query.page - 1) * query.limit;
  const ascending = query.sortOrder === "asc";

  const getSortedRequests = () => {
    switch (query.sortBy) {
      case "updatedAt":
        return filteredQuery.orderBy((bloodRequest) =>
          ascending
            ? bloodRequest.updatedAt.asc()
            : bloodRequest.updatedAt.desc(),
        );

      case "requiredAt":
        return filteredQuery.orderBy((bloodRequest) =>
          ascending
            ? bloodRequest.requiredAt.asc()
            : bloodRequest.requiredAt.desc(),
        );

      case "expiresAt":
        return filteredQuery.orderBy((bloodRequest) =>
          ascending
            ? bloodRequest.expiresAt.asc()
            : bloodRequest.expiresAt.desc(),
        );

      case "unitsRequired":
        return filteredQuery.orderBy((bloodRequest) =>
          ascending
            ? bloodRequest.unitsRequired.asc()
            : bloodRequest.unitsRequired.desc(),
        );

      case "unitsFulfilled":
        return filteredQuery.orderBy((bloodRequest) =>
          ascending
            ? bloodRequest.unitsFulfilled.asc()
            : bloodRequest.unitsFulfilled.desc(),
        );

      case "priority":
        return filteredQuery.orderBy((bloodRequest) =>
          ascending
            ? bloodRequest.priority.asc()
            : bloodRequest.priority.desc(),
        );

      case "status":
        return filteredQuery.orderBy((bloodRequest) =>
          ascending ? bloodRequest.status.asc() : bloodRequest.status.desc(),
        );

      case "createdAt":
      default:
        return filteredQuery.orderBy((bloodRequest) =>
          ascending
            ? bloodRequest.createdAt.asc()
            : bloodRequest.createdAt.desc(),
        );
    }
  };

  const [requests, countResult] = await Promise.all([
    getSortedRequests().offset(offset).limit(query.limit).all(),
    filteredQuery.aggregate((aggregate) => ({
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
      hasPreviousPage: query.page > 1 && totalPage > 0,
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
  await getOrganizationForBloodRequest(data.organizationId);
  validateRequestDates(data.requiredAt, data.expiresAt);

  return db.orm.public.BloodRequest.create({
    requesterId: userId,
    organizationId: data.organizationId,
    bloodGroup: data.bloodGroup,
    unitsRequired: data.unitsRequired,
    priority: data.priority,

    ...(data.patientName !== undefined && {
      patientName: data.patientName,
    }),
    ...(data.patientAge !== undefined && {
      patientAge: data.patientAge,
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

  if (data.organizationId !== undefined) {
    await getOrganizationForBloodRequest(data.organizationId);
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
