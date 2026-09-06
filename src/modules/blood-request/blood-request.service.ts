import httpStatus from "http-status";

import type {
  CreateBloodRequestInput,
  UpdateBloodRequestInput,
  UpdateBloodRequestStatusInput,
} from "./blood-request.schema";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

// Types

type BloodRequestActorRole =
  | "donor"
  | "recipient"
  | "volunteer"
  | "hospital"
  | "blood_bank"
  | "moderator"
  | "admin";

// Constants

const TERMINAL_STATUSES = ["fulfilled", "cancelled", "expired"] as const;

// Actor

const getActor = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

// Blood Request

const getBloodRequestById = async (requestId: string) => {
  const request = await db.orm.public.BloodRequest.where({
    id: requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  return request;
};

// Authorization

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

// Request Status Validation

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

// Date Validation

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

// Build Update Data

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

// Get My Blood Requests

const getMyBloodRequests = async (userId: string) => {
  await getActor(userId);

  return db.orm.public.BloodRequest.where({
    requesterId: userId,
  }).all();
};

// Get All Blood Requests

const getBloodRequests = async () => {
  return db.orm.public.BloodRequest.all();
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

  // Owner cannot edit terminal requests.
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

  // Moderator/Admin can delete moderated content.
  if (canModerate) {
    await db.orm.public.BloodRequest.where({
      id: requestId,
    }).delete();

    return null;
  }

  // Owner cannot delete fulfilled requests.
  if (
    request.status === "partially_fulfilled" ||
    request.status === "fulfilled"
  ) {
    throw new AppError(
      "A fulfilled or partially fulfilled request cannot be deleted",
      httpStatus.BAD_REQUEST,
    );
  }

  // Owner cannot delete expired requests.
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

// Export

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
