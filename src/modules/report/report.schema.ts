import * as z from "zod";

// Enums

export const ReportTypeSchema = z.enum([
  "user",
  "blood_request",
  "donation",
  "organization",
  "message",
  "review",
]);

export const ReportStatusSchema = z.enum([
  "pending",
  "reviewing",
  "resolved",
  "rejected",
]);

// Create

export const CreateReportSchema = z
  .object({
    type: ReportTypeSchema,
    targetId: z.uuid(),
    reason: z.string().trim().min(3).max(200),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

// Query

export const ReportSortBySchema = z.enum([
  "createdAt",
  "updatedAt",
  "status",
  "type",
]);

export const ReportQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),

    type: ReportTypeSchema.optional(),
    status: ReportStatusSchema.optional(),

    reporterId: z.uuid().optional(),
    targetId: z.uuid().optional(),

    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),

    sortBy: ReportSortBySchema.default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.createdAtFrom &&
      data.createdAtTo &&
      new Date(data.createdAtTo) < new Date(data.createdAtFrom)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["createdAtTo"],
        message: "createdAtTo must be greater than or equal to createdAtFrom",
      });
    }
  });

// Moderation

export const UpdateReportStatusSchema = z
  .object({
    status: z.enum(["reviewing", "resolved", "rejected"]),
  })
  .strict();

// Response

export const ReportSchema = z.object({
  id: z.uuid(),
  reporterId: z.uuid(),
  type: ReportTypeSchema,
  targetId: z.uuid(),
  reason: z.string(),
  description: z.string().nullable(),
  status: ReportStatusSchema,
  resolvedById: z.uuid().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type ReportQueryInput = z.infer<typeof ReportQuerySchema>;
export type UpdateReportStatusInput = z.infer<typeof UpdateReportStatusSchema>;
export type ReportResponse = z.infer<typeof ReportSchema>;
