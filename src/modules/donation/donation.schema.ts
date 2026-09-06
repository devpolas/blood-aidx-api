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

export const DonationStatusSchema = z.enum([
  "pending",
  "verified",
  "rejected",
  "cancelled",
]);

export const CreateDonationSchema = z
  .object({
    requestId: z.uuid().optional(),
    organizationId: z.uuid().optional(),
    locationId: z.uuid().optional(),
    units: z.number().int().positive().max(10),
    donatedAt: z.iso.datetime(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export const UpdateDonationStatusSchema = z
  .object({
    status: z.enum(["verified", "rejected", "cancelled"]),

    verificationNotes: z.string().trim().max(1000).optional(),
  })
  .strict();

export const DonationSchema = z.object({
  id: z.uuid(),
  donorId: z.uuid(),
  requestId: z.uuid().nullable(),
  organizationId: z.uuid().nullable(),
  locationId: z.uuid().nullable(),
  donationNumber: z.string(),
  bloodGroup: BloodGroupSchema,
  units: z.number().int(),
  donatedAt: z.string(),
  status: DonationStatusSchema,
  verifiedById: z.uuid().nullable(),
  verifiedAt: z.string().nullable(),
  verificationNotes: z.string().nullable(),
  notes: z.string().nullable(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateDonationInput = z.infer<typeof CreateDonationSchema>;

export type UpdateDonationStatusInput = z.infer<
  typeof UpdateDonationStatusSchema
>;

export type DonationResponse = z.infer<typeof DonationSchema>;
