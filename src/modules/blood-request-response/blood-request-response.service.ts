import httpStatus from "http-status";

import type {
  CreateBloodRequestResponseInput,
  UpdateBloodRequestResponseStatusInput,
} from "./blood-request-response.schema";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

// Types

type ActorRole =
  | "donor"
  | "recipient"
  | "volunteer"
  | "hospital"
  | "blood_bank"
  | "moderator"
  | "admin";

type ResponseStatus =
  "pending" | "accepted" | "declined" | "cancelled" | "completed";

type ResponseActorAccess = {
  isDonor: boolean;
  isRequester: boolean;
  canModerate: boolean;
};

// Constants

const TERMINAL_RESPONSE_STATUSES = [
  "declined",
  "cancelled",
  "completed",
] as const;

const RESPONSE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

// Actor

const getActor = async (userId: string) => {
  const actor = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!actor) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return actor;
};

// Role Helpers

const isDonorRole = (role: ActorRole) => {
  return role === "donor";
};

const isModeratorRole = (role: ActorRole) => {
  return role === "moderator" || role === "admin";
};

// Require Donor

const requireDonor = async (userId: string) => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  if (!isDonorRole(role)) {
    throw new AppError(
      "Only donors can respond to blood requests",
      httpStatus.FORBIDDEN,
    );
  }

  const donor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (!donor) {
    throw new AppError("Donor profile not found", httpStatus.NOT_FOUND);
  }

  return {
    actor,
    donor,
  };
};

// Blood Request

const getBloodRequest = async (requestId: string) => {
  const request = await db.orm.public.BloodRequest.where({
    id: requestId,
  }).first();

  if (!request) {
    throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
  }

  return request;
};

// Response

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

// Response Context

const getResponseContext = async (responseId: string) => {
  const response = await getResponseById(responseId);
  const request = await getBloodRequest(response.requestId);

  return {
    response,
    request,
  };
};

// Response Access

const getResponseAccess = async (
  userId: string,
  response: {
    donorId: string;
  },
  request: {
    requesterId: string;
  },
): Promise<ResponseActorAccess> => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  const isDonor = response.donorId === userId;
  const isRequester = request.requesterId === userId;
  const canModerate = isModeratorRole(role);

  return {
    isDonor,
    isRequester,
    canModerate,
  };
};

const requireResponseAccess = async (
  userId: string,
  response: {
    donorId: string;
  },
  request: {
    requesterId: string;
  },
) => {
  const access = await getResponseAccess(userId, response, request);

  if (!access.isDonor && !access.isRequester && !access.canModerate) {
    throw new AppError(
      "You are not allowed to access this response",
      httpStatus.FORBIDDEN,
    );
  }

  return access;
};

// Creation Validation

const validateRequestCanReceiveResponse = (
  request: {
    requesterId: string;
    status: string;
    expiresAt: string | null;
  },
  userId: string,
) => {
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

  const expiresAt = new Date(request.expiresAt).getTime();

  if (expiresAt <= Date.now()) {
    throw new AppError(
      "This blood request has expired",
      httpStatus.BAD_REQUEST,
    );
  }
};

// Donor Eligibility

const validateDonorEligibility = (
  donor: {
    availability: string;
    bloodGroup: string;
  },
  request: {
    bloodGroup: string;
  },
) => {
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
};

// Status Helpers

const isTerminalStatus = (status: string): status is ResponseStatus => {
  return TERMINAL_RESPONSE_STATUSES.includes(
    status as (typeof TERMINAL_RESPONSE_STATUSES)[number],
  );
};

const validateResponseCanBeCancelled = (status: ResponseStatus) => {
  if (
    status === RESPONSE_STATUS.CANCELLED ||
    status === RESPONSE_STATUS.COMPLETED
  ) {
    throw new AppError(
      "This response cannot be cancelled",
      httpStatus.BAD_REQUEST,
    );
  }
};

const validatePendingResponse = (
  status: ResponseStatus,
  action: "accept" | "decline",
) => {
  if (status !== RESPONSE_STATUS.PENDING) {
    throw new AppError(
      `Only pending responses can be ${action}ed`,
      httpStatus.BAD_REQUEST,
    );
  }
};

const validateAcceptedResponse = (status: ResponseStatus) => {
  if (status !== RESPONSE_STATUS.ACCEPTED) {
    throw new AppError(
      "Only accepted responses can be completed",
      httpStatus.BAD_REQUEST,
    );
  }
};

const validateCanBeDeclined = (status: ResponseStatus) => {
  if (
    status !== RESPONSE_STATUS.PENDING &&
    status !== RESPONSE_STATUS.ACCEPTED
  ) {
    throw new AppError(
      "This response cannot be declined",
      httpStatus.BAD_REQUEST,
    );
  }
};

// Create Response

const createResponse = async (
  userId: string,
  requestId: string,
  data: CreateBloodRequestResponseInput,
) => {
  const { donor } = await requireDonor(userId);

  const request = await getBloodRequest(requestId);

  validateRequestCanReceiveResponse(request, userId);

  validateDonorEligibility(donor, request);

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

// Get My Responses

const getMyResponses = async (userId: string) => {
  const { donor } = await requireDonor(userId);

  return db.orm.public.BloodRequestResponse.where({
    donorId: donor.id,
  }).all();
};

// Get Responses For Request

const getResponsesForRequest = async (userId: string, requestId: string) => {
  const request = await getBloodRequest(requestId);

  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  const isRequester = request.requesterId === userId;
  const canModerate = isModeratorRole(role);

  if (!isRequester && !canModerate) {
    throw new AppError(
      "You are not allowed to view responses for this request",
      httpStatus.FORBIDDEN,
    );
  }

  return db.orm.public.BloodRequestResponse.where({
    requestId,
  }).all();
};

// Get Response By ID

const getResponseByIdForUser = async (userId: string, responseId: string) => {
  const { response, request } = await getResponseContext(responseId);

  await requireResponseAccess(userId, response, request);

  return response;
};

// Update Response Status

const updateResponseStatus = async (
  userId: string,
  responseId: string,
  data: UpdateBloodRequestResponseStatusInput,
) => {
  const { response, request } = await getResponseContext(responseId);

  const { isDonor, isRequester, canModerate } = await requireResponseAccess(
    userId,
    response,
    request,
  );

  // Donor

  if (isDonor) {
    if (data.status !== RESPONSE_STATUS.CANCELLED) {
      throw new AppError(
        "Donors can only cancel their own response",
        httpStatus.FORBIDDEN,
      );
    }

    validateResponseCanBeCancelled(response.status as ResponseStatus);

    return db.orm.public.BloodRequestResponse.where({
      id: responseId,
    }).update({
      status: RESPONSE_STATUS.CANCELLED,
    });
  }

  // Requester

  if (isRequester) {
    switch (data.status) {
      case RESPONSE_STATUS.ACCEPTED:
        validatePendingResponse(response.status as ResponseStatus, "accept");

        return db.orm.public.BloodRequestResponse.where({
          id: responseId,
        }).update({
          status: RESPONSE_STATUS.ACCEPTED,
          acceptedAt: new Date().toISOString(),
        });

      case RESPONSE_STATUS.DECLINED:
        validateCanBeDeclined(response.status as ResponseStatus);

        return db.orm.public.BloodRequestResponse.where({
          id: responseId,
        }).update({
          status: RESPONSE_STATUS.DECLINED,
        });

      case RESPONSE_STATUS.COMPLETED:
        validateAcceptedResponse(response.status as ResponseStatus);

        return db.orm.public.BloodRequestResponse.where({
          id: responseId,
        }).update({
          status: RESPONSE_STATUS.COMPLETED,
          completedAt: new Date().toISOString(),
        });

      case RESPONSE_STATUS.CANCELLED:
        throw new AppError(
          "The requester cannot cancel a donor response",
          httpStatus.FORBIDDEN,
        );

      default:
        throw new AppError(
          "Invalid response status transition",
          httpStatus.BAD_REQUEST,
        );
    }
  }

  // Moderator / Admin

  if (canModerate) {
    if (
      data.status !== RESPONSE_STATUS.DECLINED &&
      data.status !== RESPONSE_STATUS.CANCELLED
    ) {
      throw new AppError(
        "Moderators can only decline or cancel responses",
        httpStatus.FORBIDDEN,
      );
    }

    if (isTerminalStatus(response.status)) {
      throw new AppError(
        "This response is already in a final state",
        httpStatus.BAD_REQUEST,
      );
    }

    return db.orm.public.BloodRequestResponse.where({
      id: responseId,
    }).update({
      status: data.status,
    });
  }

  throw new AppError(
    "You are not allowed to change this response status",
    httpStatus.FORBIDDEN,
  );
};

// Cancel My Response

const cancelMyResponse = async (userId: string, responseId: string) => {
  const { donor } = await requireDonor(userId);

  const response = await getResponseById(responseId);

  if (response.donorId !== donor.id) {
    throw new AppError(
      "You are not allowed to cancel this response",
      httpStatus.FORBIDDEN,
    );
  }

  validateResponseCanBeCancelled(response.status as ResponseStatus);

  return db.orm.public.BloodRequestResponse.where({
    id: responseId,
  }).update({
    status: RESPONSE_STATUS.CANCELLED,
  });
};

// Delete My Response

const deleteMyResponse = async (userId: string, responseId: string) => {
  const { donor } = await requireDonor(userId);

  const response = await getResponseById(responseId);

  if (response.donorId !== donor.id) {
    throw new AppError(
      "You are not allowed to delete this response",
      httpStatus.FORBIDDEN,
    );
  }

  if (
    response.status === RESPONSE_STATUS.ACCEPTED ||
    response.status === RESPONSE_STATUS.COMPLETED
  ) {
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

// Export

export const BloodRequestResponseService = {
  createResponse,
  getMyResponses,
  getResponsesForRequest,
  getResponseByIdForUser,
  updateResponseStatus,
  cancelMyResponse,
  deleteMyResponse,
};
