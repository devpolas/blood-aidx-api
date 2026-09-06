import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  LocationCreateInput,
  LocationUpdateInput,
} from "./location.schema";

// Authorization

type ActorRole =
  | "donor"
  | "recipient"
  | "volunteer"
  | "hospital"
  | "blood_bank"
  | "moderator"
  | "admin";

const getActor = async (userId: string) => {
  const actor = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!actor) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return actor;
};

const requireModerator = async (userId: string) => {
  const actor = await getActor(userId);

  const role = actor.role as ActorRole;

  if (role !== "moderator" && role !== "admin") {
    throw new AppError(
      "Moderator or admin access required",
      httpStatus.FORBIDDEN,
    );
  }

  return actor;
};

// Internal Queries

const getLocationById = async (locationId: string) => {
  const location = await db.orm.public.Location.where({
    id: locationId,
  }).first();

  if (!location) {
    throw new AppError("Location not found", httpStatus.NOT_FOUND);
  }

  return location;
};

const getUserById = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

// Get My Location

const getMyLocationFromDB = async ({ userId }: { userId: string }) => {
  const user = await getUserById(userId);

  if (!user.locationId) {
    throw new AppError("User has no location", httpStatus.NOT_FOUND);
  }

  return getLocationById(user.locationId);
};

// Get Location By ID
// Public

const getLocationFromDBById = async ({
  locationId,
}: {
  locationId: string;
}) => {
  return getLocationById(locationId);
};

// Create My Location

const createLocationIntoDB = async ({
  userId,
  payload,
}: {
  userId: string;
  payload: LocationCreateInput;
}) => {
  const user = await getUserById(userId);

  if (user.locationId) {
    throw new AppError("User already has a location", httpStatus.BAD_REQUEST);
  }

  return db.transaction(async (tx) => {
    const location = await tx.orm.public.Location.create({
      country: payload.country,
      division: payload.division,
      district: payload.district,
      city: payload.city,
      village: payload.village,
      postalCode: payload.postalCode,

      ...(payload.addressLine !== undefined && {
        addressLine: payload.addressLine,
      }),

      ...(payload.latitude !== undefined && {
        latitude: payload.latitude,
      }),

      ...(payload.longitude !== undefined && {
        longitude: payload.longitude,
      }),
    });

    await tx.orm.public.User.where({
      id: userId,
    }).update({
      locationId: location.id,
    });

    return location;
  });
};

// Update My Location

const updateLocationIntoDB = async ({
  userId,
  payload,
}: {
  userId: string;
  payload: LocationUpdateInput;
}) => {
  const user = await getUserById(userId);

  if (!user.locationId) {
    throw new AppError("User has no location", httpStatus.NOT_FOUND);
  }

  await getLocationById(user.locationId);

  return db.orm.public.Location.where({
    id: user.locationId,
  }).update({
    ...(payload.country !== undefined && {
      country: payload.country,
    }),

    ...(payload.division !== undefined && {
      division: payload.division,
    }),

    ...(payload.district !== undefined && {
      district: payload.district,
    }),

    ...(payload.city !== undefined && {
      city: payload.city,
    }),

    ...(payload.village !== undefined && {
      village: payload.village,
    }),

    ...(payload.postalCode !== undefined && {
      postalCode: payload.postalCode,
    }),

    ...(payload.addressLine !== undefined && {
      addressLine: payload.addressLine,
    }),

    ...(payload.latitude !== undefined && {
      latitude: payload.latitude,
    }),

    ...(payload.longitude !== undefined && {
      longitude: payload.longitude,
    }),
  });
};

// Delete My Location

const deleteMyLocationById = async ({ userId }: { userId: string }) => {
  const user = await getUserById(userId);

  if (!user.locationId) {
    throw new AppError("User has no location", httpStatus.NOT_FOUND);
  }

  const locationId = user.locationId;

  return db.transaction(async (tx) => {
    await tx.orm.public.User.where({
      id: userId,
    }).update({
      locationId: null,
    });

    return tx.orm.public.Location.where({
      id: locationId,
    }).delete();
  });
};

// Delete Location By ID
// Moderator / Admin

const deleteLocationById = async ({
  userId,
  locationId,
}: {
  userId: string;
  locationId: string;
}) => {
  await requireModerator(userId);

  await getLocationById(locationId);

  return db.transaction(async (tx) => {
    // Clear users referencing this location first.
    await tx.orm.public.User.where({
      locationId,
    }).update({
      locationId: null,
    });

    return tx.orm.public.Location.where({
      id: locationId,
    }).delete();
  });
};

export const LocationService = {
  getMyLocationFromDB,
  getLocationFromDBById,
  createLocationIntoDB,
  updateLocationIntoDB,
  deleteMyLocationById,
  deleteLocationById,
};
