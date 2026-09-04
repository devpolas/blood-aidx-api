import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  LocationCreateInput,
  LocationUpdateInput,
} from "./location.schema";

// Get My Location

export const getMyLocationFromDB = async ({ userId }: { userId: string }) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.locationId) {
    throw new AppError("User has no location", 404);
  }

  const location = await db.orm.public.Location.where({
    id: user.locationId,
  }).first();

  if (!location) {
    throw new AppError("Location not found", 404);
  }

  return location;
};

// Get Location By ID

export const getLocationFromDBById = async ({
  locationId,
}: {
  locationId: string;
}) => {
  const location = await db.orm.public.Location.where({
    id: locationId,
  }).first();

  if (!location) {
    throw new AppError("Location not found", 404);
  }

  return location;
};

// Create Location

export const createLocationIntoDB = async ({
  userId,
  payload,
}: {
  userId: string;
  payload: LocationCreateInput;
}) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.locationId) {
    throw new AppError("User already has a location", 400);
  }

  return await db.transaction(async (tx) => {
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

export const updateLocationIntoDB = async ({
  userId,
  payload,
}: {
  userId: string;
  payload: LocationUpdateInput;
}) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.locationId) {
    throw new AppError("User has no location", 404);
  }

  const location = await db.orm.public.Location.where({
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

  return location;
};

// Delete My Location

export const deleteMyLocationById = async ({ userId }: { userId: string }) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.locationId) {
    throw new AppError("User has no location", 404);
  }

  const location = await db.orm.public.Location.where({
    id: user.locationId,
  }).delete();

  return location;
};

// Delete Location By ID
// Admin / Moderator

export const deleteLocationById = async ({
  locationId,
}: {
  locationId: string;
}) => {
  const existingLocation = await db.orm.public.Location.where({
    id: locationId,
  }).first();

  if (!existingLocation) {
    throw new AppError("Location not found", 404);
  }

  return await db.orm.public.Location.where({
    id: locationId,
  }).delete();
};
