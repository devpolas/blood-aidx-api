import httpStatus from "http-status";
import type { DonorQueryInput, UpdateDonorProfileInput } from "./donor.schema";
import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

// Types

type ActorRole = "user" | "moderator" | "admin";

type LocationFilters = Pick<
  DonorQueryInput,
  "country" | "division" | "city" | "village" | "postalCode"
>;

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

const isDonorRole = (role: ActorRole) => role === "user";

const isModeratorRole = (role: ActorRole) =>
  role === "moderator" || role === "admin";

const isAdminRole = (role: ActorRole) => role === "admin";

// Require Donor

const requireDonor = async (userId: string) => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  if (!isDonorRole(role)) {
    throw new AppError(
      "Only donors can manage their donor profile",
      httpStatus.FORBIDDEN,
    );
  }

  return actor;
};

// Require Moderator / Admin

const requireModerator = async (userId: string) => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  if (!isModeratorRole(role)) {
    throw new AppError(
      "Only moderators or administrators can manage donor profiles",
      httpStatus.FORBIDDEN,
    );
  }

  return actor;
};

// Require Admin

const requireAdmin = async (userId: string) => {
  const actor = await getActor(userId);
  const role = actor.role as ActorRole;

  if (!isAdminRole(role)) {
    throw new AppError(
      "Only administrators can perform this action",
      httpStatus.FORBIDDEN,
    );
  }

  return actor;
};

// Get Donor By User ID

const getDonorByUserId = async (userId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (!donor) {
    throw new AppError("Donor profile not found", httpStatus.NOT_FOUND);
  }

  return donor;
};

// Get Donor By ID

const getDonorById = async (donorId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    id: donorId,
  }).first();

  if (!donor) {
    throw new AppError("Donor not found", httpStatus.NOT_FOUND);
  }

  return donor;
};

// Build Donor Update Data

const buildDonorUpdateData = (data: UpdateDonorProfileInput) => ({
  ...(data.bloodGroup !== undefined && {
    bloodGroup: data.bloodGroup,
  }),
  ...(data.availability !== undefined && {
    availability: data.availability,
  }),
  ...(data.lastDonationAt !== undefined && {
    lastDonationAt: data.lastDonationAt,
  }),
});

// Location Filter Helpers

const hasLocationFilters = (query: LocationFilters) =>
  Boolean(
    query.country ||
    query.division ||
    query.city ||
    query.village ||
    query.postalCode,
  );

const getMatchingUserIds = async (
  query: LocationFilters,
): Promise<string[] | undefined> => {
  if (!hasLocationFilters(query)) {
    return undefined;
  }

  let locationQuery = db.orm.public.Location;

  if (query.country) {
    locationQuery = locationQuery.where({
      country: query.country,
    });
  }

  if (query.division) {
    locationQuery = locationQuery.where({
      division: query.division,
    });
  }

  if (query.city) {
    locationQuery = locationQuery.where({
      city: query.city,
    });
  }

  if (query.village) {
    locationQuery = locationQuery.where({
      village: query.village,
    });
  }

  if (query.postalCode) {
    locationQuery = locationQuery.where({
      postalCode: query.postalCode,
    });
  }

  const locations = await locationQuery.all();

  if (locations.length === 0) {
    return [];
  }

  const locationIds = locations.map((location) => location.id);

  const users = await db.orm.public.User.where((user) =>
    user.locationId.in(locationIds),
  ).all();

  return users.map((user) => user.id);
};

// Apply Donor Filters

const applyDonorFilters = (
  query: DonorQueryInput,
  matchingUserIds?: string[],
) => {
  let donorQuery = db.orm.public.DonorProfile;

  if (query.bloodGroup) {
    donorQuery = donorQuery.where({
      bloodGroup: query.bloodGroup,
    });
  }

  if (query.availability) {
    donorQuery = donorQuery.where({
      availability: query.availability,
    });
  }

  if (query.isEligible !== undefined) {
    donorQuery = donorQuery.where({
      isEligible: query.isEligible,
    });
  }

  if (query.userId) {
    donorQuery = donorQuery.where({
      userId: query.userId,
    });
  }

  if (matchingUserIds !== undefined) {
    donorQuery = donorQuery.where((donor) => donor.userId.in(matchingUserIds));
  }

  if (query.createdAtFrom) {
    donorQuery = donorQuery.where((donor) =>
      donor.createdAt.gte(query.createdAtFrom!),
    );
  }

  if (query.createdAtTo) {
    donorQuery = donorQuery.where((donor) =>
      donor.createdAt.lte(query.createdAtTo!),
    );
  }

  if (query.lastDonationAtFrom) {
    donorQuery = donorQuery.where((donor) =>
      donor.lastDonationAt.gte(query.lastDonationAtFrom!),
    );
  }

  if (query.lastDonationAtTo) {
    donorQuery = donorQuery.where((donor) =>
      donor.lastDonationAt.lte(query.lastDonationAtTo!),
    );
  }

  return donorQuery;
};

// Empty Donor List

const getEmptyDonorList = (query: DonorQueryInput) => ({
  data: [],
  meta: {
    page: query.page,
    limit: query.limit,
    total: 0,
    totalPage: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});

// Get Donor List

const getDonorList = async (query: DonorQueryInput) => {
  const matchingUserIds = await getMatchingUserIds(query);

  if (matchingUserIds?.length === 0) {
    return getEmptyDonorList(query);
  }

  const filteredQuery = applyDonorFilters(query, matchingUserIds);

  const totalResult = await filteredQuery.aggregate((aggregate) => ({
    total: aggregate.count(),
  }));

  const total = Number(totalResult.total ?? 0);
  const offset = (query.page - 1) * query.limit;
  const ascending = query.sortOrder === "asc";

  let sortedQuery;

  switch (query.sortBy) {
    case "updatedAt":
      sortedQuery = filteredQuery.orderBy((donor) =>
        ascending ? donor.updatedAt.asc() : donor.updatedAt.desc(),
      );
      break;

    case "lastDonationAt":
      sortedQuery = filteredQuery.orderBy((donor) =>
        ascending ? donor.lastDonationAt.asc() : donor.lastDonationAt.desc(),
      );
      break;

    case "totalDonations":
      sortedQuery = filteredQuery.orderBy((donor) =>
        ascending ? donor.totalDonations.asc() : donor.totalDonations.desc(),
      );
      break;

    case "bloodGroup":
      sortedQuery = filteredQuery.orderBy((donor) =>
        ascending ? donor.bloodGroup.asc() : donor.bloodGroup.desc(),
      );
      break;

    case "availability":
      sortedQuery = filteredQuery.orderBy((donor) =>
        ascending ? donor.availability.asc() : donor.availability.desc(),
      );
      break;

    case "createdAt":
    default:
      sortedQuery = filteredQuery.orderBy((donor) =>
        ascending ? donor.createdAt.asc() : donor.createdAt.desc(),
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

// Get My Donor Profile

const getMyDonorProfile = async (userId: string) => {
  await requireDonor(userId);

  return getDonorByUserId(userId);
};

// Create / Update My Donor Profile

const upsertMyDonorProfile = async (
  userId: string,
  data: UpdateDonorProfileInput,
) => {
  await requireDonor(userId);

  const existingDonor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (existingDonor) {
    return db.orm.public.DonorProfile.where({
      userId,
    }).update(buildDonorUpdateData(data));
  }

  if (data.bloodGroup === undefined) {
    throw new AppError(
      "Blood group is required to create a donor profile",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.orm.public.DonorProfile.create({
    userId,
    bloodGroup: data.bloodGroup,
    ...(data.availability !== undefined && {
      availability: data.availability,
    }),
    ...(data.lastDonationAt !== undefined && {
      lastDonationAt: data.lastDonationAt,
    }),
  });
};

// Delete My Donor Profile

const deleteMyDonorProfile = async (userId: string) => {
  await requireDonor(userId);
  await getDonorByUserId(userId);

  await db.orm.public.DonorProfile.where({
    userId,
  }).delete();

  return null;
};

// Moderator / Admin: Update Donor Profile

const updateDonorProfileById = async (
  userId: string,
  donorId: string,
  data: UpdateDonorProfileInput,
) => {
  await requireModerator(userId);
  await getDonorById(donorId);

  return db.orm.public.DonorProfile.where({
    id: donorId,
  }).update(buildDonorUpdateData(data));
};

// Admin: Delete Donor Profile

const deleteDonorProfileById = async (userId: string, donorId: string) => {
  await requireAdmin(userId);
  await getDonorById(donorId);

  await db.orm.public.DonorProfile.where({
    id: donorId,
  }).delete();

  return null;
};

// Get Donors

const getDonors = async (query: DonorQueryInput) => {
  return getDonorList(query);
};

export const DonorService = {
  getMyDonorProfile,
  upsertMyDonorProfile,
  deleteMyDonorProfile,
  getDonorById,
  getDonors,
  updateDonorProfileById,
  deleteDonorProfileById,
};
