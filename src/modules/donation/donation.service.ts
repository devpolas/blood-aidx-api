import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  CreateDonationInput,
  UpdateDonationStatusInput,
} from "./donation.schema";

// Authorization

type ActorRole = "donor" | "hospital" | "blood_bank" | "moderator" | "admin";

const getActor = async (userId: string) => {
  const actor = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!actor) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return actor;
};

const requireDonor = async (userId: string) => {
  const actor = await getActor(userId);

  if ((actor.role as ActorRole) !== "donor") {
    throw new AppError("Donor access required", httpStatus.FORBIDDEN);
  }

  return actor;
};

const requireVerifier = async (userId: string) => {
  const actor = await getActor(userId);

  const verifierRoles: ActorRole[] = [
    "hospital",
    "blood_bank",
    "moderator",
    "admin",
  ];

  if (!verifierRoles.includes(actor.role as ActorRole)) {
    throw new AppError("Verifier access required", httpStatus.FORBIDDEN);
  }

  return actor;
};

// Internal Queries

const getDonorProfile = async (userId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (!donor) {
    throw new AppError("Donor profile not found", httpStatus.NOT_FOUND);
  }

  return donor;
};

const getDonationById = async (donationId: string) => {
  const donation = await db.orm.public.BloodDonation.where({
    id: donationId,
  }).first();

  if (!donation) {
    throw new AppError("Donation not found", httpStatus.NOT_FOUND);
  }

  return donation;
};

// Create Donation

const createDonation = async (userId: string, data: CreateDonationInput) => {
  await requireDonor(userId);

  const donor = await getDonorProfile(userId);

  if (donor.availability !== "available") {
    throw new AppError(
      "Your donor availability is not currently available",
      httpStatus.BAD_REQUEST,
    );
  }

  // Optional blood request
  if (data.requestId) {
    const request = await db.orm.public.BloodRequest.where({
      id: data.requestId,
    }).first();

    if (!request) {
      throw new AppError("Blood request not found", httpStatus.NOT_FOUND);
    }

    if (request.requesterId === userId) {
      throw new AppError(
        "You cannot donate to your own blood request",
        httpStatus.BAD_REQUEST,
      );
    }

    if (
      request.status === "cancelled" ||
      request.status === "fulfilled" ||
      request.status === "expired"
    ) {
      throw new AppError(
        "This blood request is no longer accepting donations",
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

    if (donor.bloodGroup !== request.bloodGroup) {
      throw new AppError(
        "Donor blood group does not match the blood request",
        httpStatus.BAD_REQUEST,
      );
    }

    const response = await db.orm.public.BloodRequestResponse.where({
      requestId: data.requestId,
      donorId: donor.id,
    }).first();

    if (!response) {
      throw new AppError(
        "You must respond to the blood request before donating",
        httpStatus.BAD_REQUEST,
      );
    }

    if (response.status !== "accepted") {
      throw new AppError(
        "Your blood request response must be accepted before donating",
        httpStatus.BAD_REQUEST,
      );
    }

    const remainingUnits = request.unitsRequired - request.unitsFulfilled;

    if (remainingUnits <= 0) {
      throw new AppError(
        "This blood request has already been fulfilled",
        httpStatus.BAD_REQUEST,
      );
    }

    if (data.units > remainingUnits) {
      throw new AppError(
        `Only ${remainingUnits} unit(s) are still required`,
        httpStatus.BAD_REQUEST,
      );
    }
  }

  const donationNumber = `DON-${crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)
    .toUpperCase()}`;

  return db.orm.public.BloodDonation.create({
    donorId: donor.id,

    ...(data.requestId !== undefined && {
      requestId: data.requestId,
    }),

    ...(data.organizationId !== undefined && {
      organizationId: data.organizationId,
    }),

    ...(data.locationId !== undefined && {
      locationId: data.locationId,
    }),

    donationNumber,
    bloodGroup: donor.bloodGroup,
    units: data.units,
    donatedAt: data.donatedAt,
    status: "pending",

    ...(data.notes !== undefined && {
      notes: data.notes,
    }),
  });
};

// Own Donations

const getMyDonations = async (userId: string) => {
  await requireDonor(userId);

  const donor = await getDonorProfile(userId);

  return db.orm.public.BloodDonation.where({
    donorId: donor.id,
  }).all();
};

const getDonationByIdForUser = async (userId: string, donationId: string) => {
  await requireDonor(userId);

  const donation = await getDonationById(donationId);
  const donor = await getDonorProfile(userId);

  if (donation.donorId !== donor.id) {
    throw new AppError(
      "You are not allowed to view this donation",
      httpStatus.FORBIDDEN,
    );
  }

  return donation;
};

// Donation Management
// Hospital / Blood Bank / Moderator / Admin

const getDonations = async (userId: string) => {
  await requireVerifier(userId);

  return db.orm.public.BloodDonation.all();
};

// Verify Donation

const verifyDonation = async (
  verifierId: string,
  donationId: string,
  data: UpdateDonationStatusInput,
) => {
  await requireVerifier(verifierId);

  const donation = await getDonationById(donationId);

  if (
    donation.status === "verified" ||
    donation.status === "rejected" ||
    donation.status === "cancelled"
  ) {
    throw new AppError(
      "This donation has already been finalized",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.transaction(async (tx) => {
    const updatedDonation = await tx.orm.public.BloodDonation.where({
      id: donationId,
    }).update({
      status: data.status,

      ...(data.status === "verified" && {
        verifiedById: verifierId,
        verifiedAt: new Date().toISOString(),
      }),

      ...(data.verificationNotes !== undefined && {
        verificationNotes: data.verificationNotes,
      }),
    });

    if (data.status === "verified" && donation.requestId) {
      const request = await tx.orm.public.BloodRequest.where({
        id: donation.requestId,
      }).first();

      if (!request) {
        throw new AppError(
          "Associated blood request not found",
          httpStatus.NOT_FOUND,
        );
      }

      const newFulfilledUnits = request.unitsFulfilled + donation.units;

      const newStatus =
        newFulfilledUnits >= request.unitsRequired
          ? "fulfilled"
          : "partially_fulfilled";

      await tx.orm.public.BloodRequest.where({
        id: donation.requestId,
      }).update({
        unitsFulfilled: newFulfilledUnits,
        status: newStatus,
      });

      const response = await tx.orm.public.BloodRequestResponse.where({
        requestId: donation.requestId,
        donorId: donation.donorId,
      }).first();

      if (response && response.status === "accepted") {
        await tx.orm.public.BloodRequestResponse.where({
          id: response.id,
        }).update({
          status: "completed",
          completedAt: new Date().toISOString(),
        });
      }
    }

    return updatedDonation;
  });
};

// Cancel Own Donation

const cancelMyDonation = async (userId: string, donationId: string) => {
  await requireDonor(userId);

  const donation = await getDonationById(donationId);
  const donor = await getDonorProfile(userId);

  if (donation.donorId !== donor.id) {
    throw new AppError(
      "You are not allowed to cancel this donation",
      httpStatus.FORBIDDEN,
    );
  }

  if (donation.status !== "pending") {
    throw new AppError(
      "Only pending donations can be cancelled",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.orm.public.BloodDonation.where({
    id: donationId,
  }).update({
    status: "cancelled",
  });
};

export const DonationService = {
  createDonation,
  getMyDonations,
  getDonationByIdForUser,
  getDonations,
  verifyDonation,
  cancelMyDonation,
};
