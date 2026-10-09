import { randomUUID } from "node:crypto";

import httpStatus from "http-status";

import type {
  CreateDonationInput,
  DonationQueryInput,
  UpdateDonationStatusInput,
} from "./donation.schema";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";
import { MilestoneService } from "../milestone/milestone.service";

// Authorization

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

  if (actor.role !== "user") {
    throw new AppError("Donor access required", httpStatus.FORBIDDEN);
  }

  return actor;
};

const requireGlobalVerifier = async (userId: string) => {
  const actor = await getActor(userId);

  if (actor.role !== "moderator" && actor.role !== "admin") {
    throw new AppError("Verifier access required", httpStatus.FORBIDDEN);
  }

  return actor;
};

const requireOrganizationMember = async (
  userId: string,
  organizationId: string,
  canVerify = false,
) => {
  const actor = await getActor(userId);

  if (actor.role === "moderator" || actor.role === "admin") {
    return actor;
  }

  const organization = await db.orm.public.Organization.where({
    id: organizationId,
  }).first();

  if (!organization) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  if (organization.ownerId === userId) {
    return actor;
  }

  const membership = await db.orm.public.OrganizationMember.where({
    organizationId,
    userId,
  }).first();

  if (!membership) {
    throw new AppError(
      "You are not a member of this organization",
      httpStatus.FORBIDDEN,
    );
  }

  if (
    canVerify &&
    membership.role !== "admin" &&
    membership.role !== "verifier"
  ) {
    throw new AppError(
      "You are not authorized to verify donations for this organization",
      httpStatus.FORBIDDEN,
    );
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

const getOrganization = async (organizationId: string) => {
  const organization = await db.orm.public.Organization.where({
    id: organizationId,
  }).first();

  if (!organization) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  return organization;
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

const generateDonationCertificateNo = () => {
  const year = new Date().getFullYear();

  return `DON-CERT-${year}-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)
    .toUpperCase()}`;
};

const generateVerificationCode = () =>
  randomUUID().replace(/-/g, "").toUpperCase();

// Donation List

const applyDonationFilters = (
  query: DonationQueryInput,
  filters: {
    donorId?: string;
    organizationId?: string;
    status?: "verified";
  } = {},
) => {
  let donationQuery = db.orm.public.BloodDonation;

  // Base filters
  if (filters.donorId) {
    donationQuery = donationQuery.where({
      donorId: filters.donorId,
    });
  }

  if (filters.organizationId) {
    donationQuery = donationQuery.where({
      organizationId: filters.organizationId,
    });
  }

  // Base status takes priority over the query status.
  const status = filters.status ?? query.status;

  if (status) {
    donationQuery = donationQuery.where({ status });
  }

  // Additional filters
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

  const search = query.search;

  if (search) {
    donationQuery = donationQuery.where((donation) =>
      donation.donationNumber.ilike(`%${search}%`),
    );
  }

  // Date filters
  const donatedAtFrom = query.donatedAtFrom;
  const donatedAtTo = query.donatedAtTo;
  const verifiedAtFrom = query.verifiedAtFrom;
  const verifiedAtTo = query.verifiedAtTo;
  const createdAtFrom = query.createdAtFrom;
  const createdAtTo = query.createdAtTo;

  if (donatedAtFrom) {
    donationQuery = donationQuery.where((donation) =>
      donation.donatedAt.gte(donatedAtFrom),
    );
  }

  if (donatedAtTo) {
    donationQuery = donationQuery.where((donation) =>
      donation.donatedAt.lte(donatedAtTo),
    );
  }

  if (verifiedAtFrom) {
    donationQuery = donationQuery.where((donation) =>
      donation.verifiedAt.gte(verifiedAtFrom),
    );
  }

  if (verifiedAtTo) {
    donationQuery = donationQuery.where((donation) =>
      donation.verifiedAt.lte(verifiedAtTo),
    );
  }

  if (createdAtFrom) {
    donationQuery = donationQuery.where((donation) =>
      donation.createdAt.gte(createdAtFrom),
    );
  }

  if (createdAtTo) {
    donationQuery = donationQuery.where((donation) =>
      donation.createdAt.lte(createdAtTo),
    );
  }

  return donationQuery;
};

const getDonationList = async (
  query: DonationQueryInput,
  filters: {
    donorId?: string;
    organizationId?: string;
    status?: "verified";
  } = {},
) => {
  const filteredQuery = applyDonationFilters(query, filters);

  const offset = (query.page - 1) * query.limit;
  const ascending = query.sortOrder === "asc";

  const getSortedDonations = () => {
    switch (query.sortBy) {
      case "updatedAt":
        return filteredQuery.orderBy((donation) =>
          ascending ? donation.updatedAt.asc() : donation.updatedAt.desc(),
        );

      case "donatedAt":
        return filteredQuery.orderBy((donation) =>
          ascending ? donation.donatedAt.asc() : donation.donatedAt.desc(),
        );

      case "verifiedAt":
        return filteredQuery.orderBy((donation) =>
          ascending ? donation.verifiedAt.asc() : donation.verifiedAt.desc(),
        );

      case "units":
        return filteredQuery.orderBy((donation) =>
          ascending ? donation.units.asc() : donation.units.desc(),
        );

      case "status":
        return filteredQuery.orderBy((donation) =>
          ascending ? donation.status.asc() : donation.status.desc(),
        );

      case "createdAt":
      default:
        return filteredQuery.orderBy((donation) =>
          ascending ? donation.createdAt.asc() : donation.createdAt.desc(),
        );
    }
  };

  const [data, countResult] = await Promise.all([
    getSortedDonations().offset(offset).limit(query.limit).all(),
    filteredQuery.aggregate((aggregate) => ({
      total: aggregate.count(),
    })),
  ]);

  const total = countResult.total;
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

// Create Donation

const createDonation = async (userId: string, data: CreateDonationInput) => {
  await requireDonor(userId);

  const donor = await getDonorProfile(userId);
  const organization = await getOrganization(data.organizationId);

  if (organization.type !== "hospital" && organization.type !== "blood_bank") {
    throw new AppError(
      "Donations can only be made through a hospital or blood bank",
      httpStatus.BAD_REQUEST,
    );
  }

  if (organization.status !== "active" && organization.status !== "verified") {
    throw new AppError(
      "This organization is not currently accepting donations",
      httpStatus.BAD_REQUEST,
    );
  }

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

    if (request.organizationId !== data.organizationId) {
      throw new AppError(
        "Donation organization must match the blood request organization",
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

  const donationNumber = `DON-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)
    .toUpperCase()}`;

  return db.orm.public.BloodDonation.create({
    donorId: donor.id,
    organizationId: data.organizationId,
    ...(data.requestId !== undefined && {
      requestId: data.requestId,
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

// Donation Detail

const getDonationByIdForUser = async (userId: string, donationId: string) => {
  const actor = await getActor(userId);
  const donation = await getDonationById(donationId);

  // Donor can view their own donation.

  if (actor.role === "user") {
    const donor = await getDonorProfile(userId);

    if (donation.donorId === donor.id) {
      return donation;
    }
  }

  // Organization members can view donations belonging
  // to their organization.

  const organization = await getOrganization(donation.organizationId);

  if (organization.ownerId === userId) {
    return donation;
  }

  const membership = await db.orm.public.OrganizationMember.where({
    organizationId: donation.organizationId,
    userId,
  }).first();

  if (membership) {
    return donation;
  }

  // Moderator / Admin can view any donation.

  if (actor.role === "moderator" || actor.role === "admin") {
    return donation;
  }

  throw new AppError(
    "You are not allowed to view this donation",
    httpStatus.FORBIDDEN,
  );
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

// Organization Donations

const getOrganizationDonations = async (
  userId: string,
  organizationId: string,
  query: DonationQueryInput,
) => {
  await requireOrganizationMember(userId, organizationId);
  await getOrganization(organizationId);

  return getDonationList(query, {
    organizationId,
  });
};

// Moderator / Admin

const getDonations = async (userId: string, query: DonationQueryInput) => {
  await requireGlobalVerifier(userId);

  return getDonationList(query);
};

// Verify / Reject Donation

// Verify / Reject Donation

const verifyDonation = async (
  verifierId: string,
  donationId: string,
  data: UpdateDonationStatusInput,
) => {
  const donation = await getDonationById(donationId);

  if (donation.status !== "pending") {
    throw new AppError(
      "Only pending donations can be verified or rejected",
      httpStatus.BAD_REQUEST,
    );
  }

  const verifier = await requireOrganizationMember(
    verifierId,
    donation.organizationId,
    true,
  );

  return db.transaction(async (tx) => {
    const now = new Date().toISOString();

    const updateData =
      data.status === "verified"
        ? {
            status: "verified" as const,
            verifiedById: verifier.id,
            verifiedAt: now,
            rejectionReason: null,
          }
        : {
            status: "rejected" as const,
            verifiedById: null,
            verifiedAt: null,
            rejectionReason: data.rejectionReason!,
          };

    const updatedDonation = await tx.orm.public.BloodDonation.where({
      id: donationId,
    }).update(updateData);

    if (!updatedDonation) {
      throw new AppError("Donation not found", httpStatus.NOT_FOUND);
    }

    if (data.status === "rejected") {
      return updatedDonation;
    }

    // Donor

    const donor = await tx.orm.public.DonorProfile.where({
      id: donation.donorId,
    }).first();

    if (!donor) {
      throw new AppError("Donor profile not found", httpStatus.NOT_FOUND);
    }

    const donorUser = await tx.orm.public.User.where({
      id: donor.userId,
    }).first();

    if (!donorUser) {
      throw new AppError("Donor user not found", httpStatus.NOT_FOUND);
    }

    const newDonationCount = donor.totalDonations + 1;

    await tx.orm.public.DonorProfile.where({
      id: donor.id,
    }).update({
      totalDonations: newDonationCount,
      lastDonationAt: now,
    });

    // Blood Request

    if (donation.requestId) {
      const request = await tx.orm.public.BloodRequest.where({
        id: donation.requestId,
      }).first();

      if (!request) {
        throw new AppError(
          "Associated blood request not found",
          httpStatus.NOT_FOUND,
        );
      }

      if (request.organizationId !== donation.organizationId) {
        throw new AppError(
          "Donation organization does not match the blood request organization",
          httpStatus.BAD_REQUEST,
        );
      }

      const newFulfilledUnits = request.unitsFulfilled + donation.units;

      if (newFulfilledUnits > request.unitsRequired) {
        throw new AppError(
          "Donation units exceed the remaining blood request units",
          httpStatus.BAD_REQUEST,
        );
      }

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

      if (response?.status === "accepted") {
        await tx.orm.public.BloodRequestResponse.where({
          id: response.id,
        }).update({
          status: "completed",
          completedAt: now,
        });
      }
    }

    // Donation Certificate

    const certificate = await tx.orm.public.DonationCertificate.create({
      donationId: updatedDonation.id,
      certificateNo: generateDonationCertificateNo(),
      verificationCode: generateVerificationCode(),
      donorName: donorUser.name,
      bloodGroup: updatedDonation.bloodGroup,
      donationNumber: updatedDonation.donationNumber,
      donatedAt: updatedDonation.donatedAt,
    });

    // Donation Milestones

    const milestones = await MilestoneService.processDonationMilestones(
      tx,
      donor.userId,
      newDonationCount,
      donorUser.name,
    );

    return {
      donation: updatedDonation,
      certificate,
      milestones,
    };
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
  getOrganizationDonations,
  getDonations,
  verifyDonation,
  cancelMyDonation,
};
