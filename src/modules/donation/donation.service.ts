import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  CreateDonationInput,
  DonationQueryInput,
  UpdateDonationStatusInput,
} from "./donation.schema";

// Authorization

type ActorRole = "user" | "moderator" | "admin";

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

  if ((actor.role as ActorRole) !== "user") {
    throw new AppError("Donor access required", httpStatus.FORBIDDEN);
  }

  return actor;
};

const requireVerifier = async (userId: string) => {
  const actor = await getActor(userId);

  const verifierRoles: ActorRole[] = ["moderator", "admin"];

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

const getDonorProfileById = async (donorId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    id: donorId,
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

// Donation List

const applyDonationFilters = (
  query: DonationQueryInput,
  filters: {
    donorId?: string;
    status?: "verified";
  } = {},
) => {
  let donationQuery = db.orm.public.BloodDonation;

  if (filters.donorId) {
    donationQuery = donationQuery.where({
      donorId: filters.donorId,
    });
  }

  // Base status takes priority over the query status.
  if (filters.status) {
    donationQuery = donationQuery.where({
      status: filters.status,
    });
  } else if (query.status) {
    donationQuery = donationQuery.where({
      status: query.status,
    });
  }

  if (query.donorId) {
    donationQuery = donationQuery.where({
      donorId: query.donorId,
    });
  }

  if (query.requestId) {
    donationQuery = donationQuery.where({
      requestId: query.requestId,
    });
  }

  if (query.organizationId) {
    donationQuery = donationQuery.where({
      organizationId: query.organizationId,
    });
  }

  if (query.locationId) {
    donationQuery = donationQuery.where({
      locationId: query.locationId,
    });
  }

  if (query.verifiedById) {
    donationQuery = donationQuery.where({
      verifiedById: query.verifiedById,
    });
  }

  if (query.search) {
    const search = `%${query.search}%`;

    donationQuery = donationQuery.where((donation) =>
      donation.donationNumber.ilike(search),
    );
  }

  if (query.donatedAtFrom) {
    donationQuery = donationQuery.where((donation) =>
      donation.donatedAt.gte(query.donatedAtFrom!),
    );
  }

  if (query.donatedAtTo) {
    donationQuery = donationQuery.where((donation) =>
      donation.donatedAt.lte(query.donatedAtTo!),
    );
  }

  if (query.verifiedAtFrom) {
    donationQuery = donationQuery.where((donation) =>
      donation.verifiedAt.gte(query.verifiedAtFrom!),
    );
  }

  if (query.verifiedAtTo) {
    donationQuery = donationQuery.where((donation) =>
      donation.verifiedAt.lte(query.verifiedAtTo!),
    );
  }

  if (query.createdAtFrom) {
    donationQuery = donationQuery.where((donation) =>
      donation.createdAt.gte(query.createdAtFrom!),
    );
  }

  if (query.createdAtTo) {
    donationQuery = donationQuery.where((donation) =>
      donation.createdAt.lte(query.createdAtTo!),
    );
  }

  return donationQuery;
};

const getDonationList = async (
  query: DonationQueryInput,
  filters: {
    donorId?: string;
    status?: "verified";
  } = {},
) => {
  const filteredQuery = applyDonationFilters(query, filters);

  const totalResult = await filteredQuery.aggregate((aggregate) => ({
    total: aggregate.count(),
  }));

  const total = Number(totalResult.total ?? 0);

  const offset = (query.page - 1) * query.limit;
  const ascending = query.sortOrder === "asc";

  let sortedQuery;

  switch (query.sortBy) {
    case "updatedAt":
      sortedQuery = filteredQuery.orderBy((donation) =>
        ascending ? donation.updatedAt.asc() : donation.updatedAt.desc(),
      );
      break;

    case "donatedAt":
      sortedQuery = filteredQuery.orderBy((donation) =>
        ascending ? donation.donatedAt.asc() : donation.donatedAt.desc(),
      );
      break;

    case "verifiedAt":
      sortedQuery = filteredQuery.orderBy((donation) =>
        ascending ? donation.verifiedAt.asc() : donation.verifiedAt.desc(),
      );
      break;

    case "units":
      sortedQuery = filteredQuery.orderBy((donation) =>
        ascending ? donation.units.asc() : donation.units.desc(),
      );
      break;

    case "status":
      sortedQuery = filteredQuery.orderBy((donation) =>
        ascending ? donation.status.asc() : donation.status.desc(),
      );
      break;

    case "createdAt":
    default:
      sortedQuery = filteredQuery.orderBy((donation) =>
        ascending ? donation.createdAt.asc() : donation.createdAt.desc(),
      );
      break;
  }

  const data = await sortedQuery.offset(offset).limit(query.limit).all();

  const totalPage = Math.ceil(total / query.limit);

  return {
    data,
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

const getMyDonations = async (userId: string, query: DonationQueryInput) => {
  await requireDonor(userId);

  const donor = await getDonorProfile(userId);

  return getDonationList(query, {
    donorId: donor.id,
  });
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

// Public Donor Donations

const getDonorDonations = async (
  donorId: string,
  query: DonationQueryInput,
) => {
  await getDonorProfileById(donorId);

  return getDonationList(query, {
    donorId,
    status: "verified",
  });
};

// Donation Management

// Moderator / Admin

const getDonations = async (userId: string, query: DonationQueryInput) => {
  await requireVerifier(userId);

  return getDonationList(query);
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
  getDonorDonations,
  getDonations,
  verifyDonation,
  cancelMyDonation,
};
