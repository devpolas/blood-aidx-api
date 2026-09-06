import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type { UpdateDonorProfileInput } from "./donor.schema";

const getMyDonorProfile = async (userId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (!donor) {
    throw new AppError("Donor profile not found", httpStatus.NOT_FOUND);
  }

  return donor;
};

const upsertMyDonorProfile = async (
  userId: string,
  data: UpdateDonorProfileInput,
) => {
  const existingDonor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (existingDonor) {
    const updateData = {
      ...(data.bloodGroup !== undefined && {
        bloodGroup: data.bloodGroup,
      }),

      ...(data.availability !== undefined && {
        availability: data.availability,
      }),

      ...(data.lastDonationAt !== undefined && {
        lastDonationAt: data.lastDonationAt,
      }),
    };

    return db.orm.public.DonorProfile.where({
      userId,
    }).update(updateData);
  }

  if (!data.bloodGroup) {
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

const deleteMyDonorProfile = async (userId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    userId,
  }).first();

  if (!donor) {
    throw new AppError("Donor profile not found", httpStatus.NOT_FOUND);
  }

  await db.orm.public.DonorProfile.where({
    userId,
  }).delete();

  return null;
};

const getDonorById = async (donorId: string) => {
  const donor = await db.orm.public.DonorProfile.where({
    id: donorId,
  }).first();

  if (!donor) {
    throw new AppError("Donor not found", httpStatus.NOT_FOUND);
  }

  return donor;
};

const getDonors = async () => {
  return db.orm.public.DonorProfile.all();
};

export const DonorService = {
  getMyDonorProfile,
  upsertMyDonorProfile,
  deleteMyDonorProfile,
  getDonorById,
  getDonors,
};
