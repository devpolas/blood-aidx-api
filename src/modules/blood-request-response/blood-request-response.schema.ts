import * as z from "zod";

// Enums

export const RequestResponseStatusSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "completed",
]);

export const UpdateResponseStatusSchema = z.enum([
  "accepted",
  "declined",
  "cancelled",
  "completed",
]);

// Create Response

export const CreateBloodRequestResponseSchema = z
  .object({
    message: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

// Update Response Status

export const UpdateBloodRequestResponseStatusSchema = z
  .object({
    status: UpdateResponseStatusSchema,
  })
  .strict();

// Response

export const BloodRequestResponseSchema = z.object({
  id: z.uuid(),
  requestId: z.uuid(),
  donorId: z.uuid(),
  status: RequestResponseStatusSchema,
  message: z.string().nullable(),
  respondedAt: z.string().nullable(),
  acceptedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types

export type CreateBloodRequestResponseInput = z.infer<
  typeof CreateBloodRequestResponseSchema
>;

export type UpdateBloodRequestResponseStatusInput = z.infer<
  typeof UpdateBloodRequestResponseStatusSchema
>;

export type BloodRequestResponseOutput = z.infer<
  typeof BloodRequestResponseSchema
>;

export const BloodRequestResponseSortBySchema = z.enum([
  "createdAt",
  "updatedAt",
  "respondedAt",
  "acceptedAt",
  "completedAt",
  "status",
]);

export const BloodRequestResponseQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
    status: RequestResponseStatusSchema.optional(),
    requestId: z.uuid().optional(),
    respondedAtFrom: z.iso.datetime().optional(),
    respondedAtTo: z.iso.datetime().optional(),
    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),
    sortBy: BloodRequestResponseSortBySchema.default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ranges = [
      [
        "respondedAtFrom",
        "respondedAtTo",
        data.respondedAtFrom,
        data.respondedAtTo,
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

export type BloodRequestResponseQueryInput = z.infer<
  typeof BloodRequestResponseQuerySchema
>;
