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
    organizationId: z.uuid(),
    locationId: z.uuid().optional(),
    units: z.number().int().positive().max(10),
    donatedAt: z.iso.datetime(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export const UpdateDonationStatusSchema = z
  .object({
    status: z.enum(["verified", "rejected", "cancelled"]),
    rejectionReason: z.string().trim().max(1000).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.status === "rejected" && !data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting a donation",
      });
    }

    if (data.status !== "rejected" && data.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message:
          "Rejection reason can only be provided when rejecting a donation",
      });
    }
  });

export const DonationSchema = z.object({
  id: z.uuid(),
  donorId: z.uuid(),
  requestId: z.uuid().nullable(),
  organizationId: z.uuid(),
  locationId: z.uuid().nullable(),
  donationNumber: z.string(),
  bloodGroup: BloodGroupSchema,
  units: z.number().int(),
  donatedAt: z.string(),
  status: DonationStatusSchema,
  verifiedAt: z.string().nullable(),
  verifiedById: z.uuid().nullable(),
  rejectionReason: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateDonationInput = z.infer<typeof CreateDonationSchema>;

export type UpdateDonationStatusInput = z.infer<
  typeof UpdateDonationStatusSchema
>;

export type DonationResponse = z.infer<typeof DonationSchema>;

export const DonationSortBySchema = z.enum([
  "createdAt",
  "updatedAt",
  "donatedAt",
  "verifiedAt",
  "units",
  "status",
]);

export const DonationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),

    search: z.string().trim().min(1).max(100).optional(),

    status: DonationStatusSchema.optional(),

    donorId: z.uuid().optional(),
    requestId: z.uuid().optional(),
    organizationId: z.uuid().optional(),
    locationId: z.uuid().optional(),
    verifiedById: z.uuid().optional(),

    donatedAtFrom: z.iso.datetime().optional(),
    donatedAtTo: z.iso.datetime().optional(),

    verifiedAtFrom: z.iso.datetime().optional(),
    verifiedAtTo: z.iso.datetime().optional(),

    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),

    sortBy: DonationSortBySchema.default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ranges = [
      ["donatedAtFrom", "donatedAtTo", data.donatedAtFrom, data.donatedAtTo],
      [
        "verifiedAtFrom",
        "verifiedAtTo",
        data.verifiedAtFrom,
        data.verifiedAtTo,
      ],
      ["createdAtFrom", "createdAtTo", data.createdAtFrom, data.createdAtTo],
    ] as const;

    for (const [fromKey, toKey, from, to] of ranges) {
      if (!from || !to) continue;

      if (new Date(to) < new Date(from)) {
        ctx.addIssue({
          code: "custom",
          path: [toKey],
          message: `${toKey} must be greater than or equal to ${fromKey}`,
        });
      }
    }
  });

export type DonationQueryInput = z.infer<typeof DonationQuerySchema>;
