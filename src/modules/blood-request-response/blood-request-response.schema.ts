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
