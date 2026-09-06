import * as z from "zod";

export const RequestResponseStatusSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "completed",
]);

export const CreateBloodRequestResponseSchema = z
  .object({
    message: z.string().trim().max(1000).optional(),
  })
  .strict();

export const UpdateBloodRequestResponseStatusSchema = z
  .object({
    status: z.enum(["accepted", "declined", "cancelled", "completed"]),
  })
  .strict();

export const BloodRequestResponseSchema = z.object({
  id: z.uuid(),
  requestId: z.uuid(),
  donorId: z.uuid(),
  status: RequestResponseStatusSchema,
  message: z.string().nullable(),
  respondedAt: z.date().nullable(),
  acceptedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateBloodRequestResponseInput = z.infer<
  typeof CreateBloodRequestResponseSchema
>;

export type UpdateBloodRequestResponseStatusInput = z.infer<
  typeof UpdateBloodRequestResponseStatusSchema
>;

export type BloodRequestResponseOutput = z.infer<
  typeof BloodRequestResponseSchema
>;
