import httpStatus from "http-status";

import type {
  CreateBloodRequestInput,
  UpdateBloodRequestInput,
  UpdateBloodRequestStatusInput,
} from "./blood-request.schema";
import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

const getMyBloodRequests = async (userId: string) => {
  return db.orm.public.BloodRequest.where({
    requesterId: userId,
  }).all();
};

const getBloodRequests = async () => {
  return db.orm.public.BloodRequest.all();
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

const createBloodRequest = async (
  userId: string,
  data: CreateBloodRequestInput,
) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  const request = await db.orm.public.BloodRequest.create({
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

  return request;
};

const updateBloodRequest = async (
  userId: string,
  requestId: string,
  data: UpdateBloodRequestInput,
) => {
  const request = await db.orm.public.BloodRequest.where({
    id: requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  if (request.requesterId !== userId) {
    throw new AppError(
      "You are not allowed to update this blood request",
      httpStatus.FORBIDDEN,
    );
  }

  if (
    request.status === "fulfilled" ||
    request.status === "cancelled" ||
    request.status === "expired"
  ) {
    throw new AppError(
      "This blood request can no longer be updated",
      httpStatus.BAD_REQUEST,
    );
  }

  const updateData = {
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

  return db.orm.public.BloodRequest.where({
    id: requestId,
  }).update(updateData);
};

const updateBloodRequestStatus = async (
  userId: string,
  requestId: string,
  data: UpdateBloodRequestStatusInput,
) => {
  const request = await db.orm.public.BloodRequest.where({
    id: requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  if (request.requesterId !== userId) {
    throw new AppError(
      "You are not allowed to change this blood request",
      httpStatus.FORBIDDEN,
    );
  }

  if (data.status === "cancelled") {
    if (
      request.status === "fulfilled" ||
      request.status === "cancelled" ||
      request.status === "expired"
    ) {
      throw new AppError(
        "This blood request cannot be cancelled",
        httpStatus.BAD_REQUEST,
      );
    }
  }

  if (request.status === "fulfilled" && data.status !== "fulfilled") {
    throw new AppError(
      "A fulfilled blood request cannot change status",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.orm.public.BloodRequest.where({
    id: requestId,
  }).update({
    status: data.status,
  });
};

const cancelBloodRequest = async (userId: string, requestId: string) => {
  return updateBloodRequestStatus(userId, requestId, {
    status: "cancelled",
  });
};

const deleteBloodRequest = async (userId: string, requestId: string) => {
  const request = await db.orm.public.BloodRequest.where({
    id: requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  if (request.requesterId !== userId) {
    throw new AppError(
      "You are not allowed to delete this blood request",
      httpStatus.FORBIDDEN,
    );
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
