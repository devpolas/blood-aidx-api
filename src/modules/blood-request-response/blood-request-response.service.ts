import httpStatus from "http-status";

import type {
  CreateBloodRequestResponseInput,
  UpdateBloodRequestResponseStatusInput,
} from "./blood-request-response.schema";
import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

const getDonorProfile = async (userId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (!donor) {
    throw new AppError("Donor profile not found", httpStatus.NOT_FOUND);
  }

  return donor;
};

const getResponseById = async (responseId: string) => {
  const response = await db.orm.public.BloodRequestResponse.where({
    id: responseId,
  }).first();

  if (!response) {
    throw new AppError(
      "Blood request response not found",
      httpStatus.NOT_FOUND,
    );
  }

  return response;
};

const createResponse = async (
  userId: string,
  requestId: string,
  data: CreateBloodRequestResponseInput,
) => {
  const donor = await getDonorProfile(userId);

  const request = await db.orm.public.BloodRequest.where({
    id: requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  if (request.requesterId === userId) {
    throw new AppError(
      "You cannot respond to your own blood request",
      httpStatus.BAD_REQUEST,
    );
  }

  if (
    request.status === "cancelled" ||
    request.status === "fulfilled" ||
    request.status === "expired"
  ) {
    throw new AppError(
      "This blood request is no longer accepting responses",
      httpStatus.BAD_REQUEST,
    );
  }

  if (!request.expiresAt) {
    throw new AppError(
      "Blood request expiration time is missing",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (new Date(request.expiresAt) <= new Date()) {
    throw new AppError(
      "This blood request has expired",
      httpStatus.BAD_REQUEST,
    );
  }

  if (donor.availability !== "available") {
    throw new AppError(
      "Your donor availability is not currently available",
      httpStatus.BAD_REQUEST,
    );
  }

  if (donor.bloodGroup !== request.bloodGroup) {
    throw new AppError(
      "Your blood group does not match this request",
      httpStatus.BAD_REQUEST,
    );
  }

  const existingResponse = await db.orm.public.BloodRequestResponse.where({
    requestId,
    donorId: donor.id,
  }).first();

  if (existingResponse) {
    throw new AppError(
      "You have already responded to this blood request",
      httpStatus.CONFLICT,
    );
  }

  return db.orm.public.BloodRequestResponse.create({
    requestId,
    donorId: donor.id,

    ...(data.message !== undefined && {
      message: data.message,
    }),

    respondedAt: new Date().toISOString(),
  });
};

const getMyResponses = async (userId: string) => {
  const donor = await getDonorProfile(userId);

  return db.orm.public.BloodRequestResponse.where({
    donorId: donor.id,
  }).all();
};

const getResponsesForRequest = async (userId: string, requestId: string) => {
  const request = await db.orm.public.BloodRequest.where({
    id: requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  if (request.requesterId !== userId) {
    throw new AppError(
      "You are not allowed to view responses for this request",
      httpStatus.FORBIDDEN,
    );
  }

  return db.orm.public.BloodRequestResponse.where({
    requestId,
  }).all();
};

const getResponseByIdForUser = async (userId: string, responseId: string) => {
  const response = await getResponseById(responseId);

  const donor = await getDonorProfile(userId);

  const request = await db.orm.public.BloodRequest.where({
    id: response.requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  const isDonor = response.donorId === donor.id;
  const isRequester = request.requesterId === userId;

  if (!isDonor && !isRequester) {
    throw new AppError(
      "You are not allowed to view this response",
      httpStatus.FORBIDDEN,
    );
  }

  return response;
};

const updateResponseStatus = async (
  userId: string,
  responseId: string,
  data: UpdateBloodRequestResponseStatusInput,
) => {
  const response = await getResponseById(responseId);

  const donor = await getDonorProfile(userId);

  const request = await db.orm.public.BloodRequest.where({
    id: response.requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  const isDonor = response.donorId === donor.id;
  const isRequester = request.requesterId === userId;

  if (!isDonor && !isRequester) {
    throw new AppError(
      "You are not allowed to modify this response",
      httpStatus.FORBIDDEN,
    );
  }

  // Donor actions

  if (isDonor) {
    if (data.status === "cancelled") {
      if (response.status === "completed" || response.status === "cancelled") {
        throw new AppError(
          "This response cannot be cancelled",
          httpStatus.BAD_REQUEST,
        );
      }

      return db.orm.public.BloodRequestResponse.where({
        id: responseId,
      }).update({
        status: "cancelled",
      });
    }

    if (data.status === "accepted" || data.status === "completed") {
      throw new AppError(
        "Donors cannot set this response status",
        httpStatus.FORBIDDEN,
      );
    }
  }

  // Requester actions

  if (isRequester) {
    if (data.status === "accepted") {
      if (response.status !== "pending") {
        throw new AppError(
          "Only pending responses can be accepted",
          httpStatus.BAD_REQUEST,
        );
      }

      return db.orm.public.BloodRequestResponse.where({
        id: responseId,
      }).update({
        status: "accepted",
        acceptedAt: new Date().toISOString(),
      });
    }

    if (data.status === "declined") {
      if (response.status !== "pending" && response.status !== "accepted") {
        throw new AppError(
          "This response cannot be declined",
          httpStatus.BAD_REQUEST,
        );
      }

      return db.orm.public.BloodRequestResponse.where({
        id: responseId,
      }).update({
        status: "declined",
      });
    }

    if (data.status === "completed") {
      if (response.status !== "accepted") {
        throw new AppError(
          "Only accepted responses can be completed",
          httpStatus.BAD_REQUEST,
        );
      }

      return db.orm.public.BloodRequestResponse.where({
        id: responseId,
      }).update({
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    }

    if (data.status === "cancelled") {
      throw new AppError(
        "The requester cannot cancel a donor response",
        httpStatus.FORBIDDEN,
      );
    }
  }

  throw new AppError(
    "Invalid response status transition",
    httpStatus.BAD_REQUEST,
  );
};

const cancelMyResponse = async (userId: string, responseId: string) => {
  const response = await getResponseById(responseId);

  const donor = await getDonorProfile(userId);

  if (response.donorId !== donor.id) {
    throw new AppError(
      "You are not allowed to cancel this response",
      httpStatus.FORBIDDEN,
    );
  }

  if (response.status === "completed" || response.status === "cancelled") {
    throw new AppError(
      "This response cannot be cancelled",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.orm.public.BloodRequestResponse.where({
    id: responseId,
  }).update({
    status: "cancelled",
  });
};

const deleteMyResponse = async (userId: string, responseId: string) => {
  const response = await getResponseById(responseId);

  const donor = await getDonorProfile(userId);

  if (response.donorId !== donor.id) {
    throw new AppError(
      "You are not allowed to delete this response",
      httpStatus.FORBIDDEN,
    );
  }

  if (response.status === "accepted" || response.status === "completed") {
    throw new AppError(
      "An accepted or completed response cannot be deleted",
      httpStatus.BAD_REQUEST,
    );
  }

  await db.orm.public.BloodRequestResponse.where({
    id: responseId,
  }).delete();

  return null;
};

export const BloodRequestResponseService = {
  createResponse,
  getMyResponses,
  getResponsesForRequest,
  getResponseByIdForUser,
  updateResponseStatus,
  cancelMyResponse,
  deleteMyResponse,
};
