import * as z from "zod";

export const BloodGroupSchema = z.enum([
  "a_positive",
  "a_negative",
  "b_positive",
  "b_negative",
  "ab_positive",
  "ab_negative",
  "o_positive",
  "o_negative",
]);

export const DonorAvailabilitySchema = z.enum([
  "available",
  "unavailable",
  "temporarily_unavailable",
]);

export const UpdateDonorProfileSchema = z
  .object({
    bloodGroup: BloodGroupSchema.optional(),
    availability: DonorAvailabilitySchema.optional(),
    lastDonationAt: z.iso.datetime().nullable().optional(),
  })
  .strict();

export const DonorProfileSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),

  bloodGroup: BloodGroupSchema,
  availability: DonorAvailabilitySchema,
  lastDonationAt: z.string().nullable(),
  totalDonations: z.number(),
  isEligible: z.boolean(),
  eligibilityCheckedAt: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UpdateDonorProfileInput = z.infer<typeof UpdateDonorProfileSchema>;
export type DonorProfileResponse = z.infer<typeof DonorProfileSchema>;
