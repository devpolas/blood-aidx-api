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

export const DonorSortBySchema = z.enum([
  "createdAt",
  "updatedAt",
  "lastDonationAt",
  "totalDonations",
  "bloodGroup",
  "availability",
]);

export const DonorQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),

    bloodGroup: BloodGroupSchema.optional(),
    availability: DonorAvailabilitySchema.optional(),
    isEligible: z.coerce.boolean().optional(),

    userId: z.uuid().optional(),

    lastDonationAtFrom: z.iso.datetime().optional(),
    lastDonationAtTo: z.iso.datetime().optional(),

    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),

    sortBy: DonorSortBySchema.default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ranges = [
      [
        "lastDonationAtFrom",
        "lastDonationAtTo",
        data.lastDonationAtFrom,
        data.lastDonationAtTo,
      ],
      ["createdAtFrom", "createdAtTo", data.createdAtFrom, data.createdAtTo],
    ] as const;

    for (const [fromKey, toKey, from, to] of ranges) {
      if (from && to && new Date(to) < new Date(from)) {
        ctx.addIssue({
          code: "custom",
          path: [toKey],
          message: `${toKey} must be greater than or equal to ${fromKey}`,
        });
      }
    }
  });

export type DonorQueryInput = z.infer<typeof DonorQuerySchema>;
