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

// Moderation

export const UpdateReportStatusSchema = z
  .object({
    status: ReportStatusSchema,
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
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type UpdateReportStatusInput = z.infer<typeof UpdateReportStatusSchema>;
export type ReportResponse = z.infer<typeof ReportSchema>;
