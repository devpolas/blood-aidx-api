import * as z from "zod";

// Enums

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

export const PrioritySchema = z.enum(["low", "high", "urgent"]);

export const BloodRequestStatusSchema = z.enum([
  "open",
  "partially_fulfilled",
  "fulfilled",
  "cancelled",
  "expired",
]);

// Create Blood Request

export const CreateBloodRequestSchema = z
  .object({
    locationId: z.uuid().optional(),
    bloodGroup: BloodGroupSchema,
    unitsRequired: z.number().int().positive().max(100),
    priority: PrioritySchema.default("high"),
    patientName: z.string().trim().min(2).max(150),
    hospitalName: z.string().trim().min(2).max(200),
    requiredAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const requiredAt = new Date(data.requiredAt);
    const expiresAt = new Date(data.expiresAt);

    if (expiresAt <= requiredAt) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expiration time must be after required time",
      });
    }
  });

// Update Blood Request

export const UpdateBloodRequestSchema = z
  .object({
    locationId: z.uuid().nullable().optional(),
    bloodGroup: BloodGroupSchema.optional(),
    unitsRequired: z.number().int().positive().max(100).optional(),
    priority: PrioritySchema.optional(),
    patientName: z.string().trim().min(2).max(150).optional(),
    hospitalName: z.string().trim().min(2).max(200).optional(),
    requiredAt: z.iso.datetime().optional(),
    expiresAt: z.iso.datetime().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.requiredAt !== undefined && data.expiresAt !== undefined) {
      const requiredAt = new Date(data.requiredAt);
      const expiresAt = new Date(data.expiresAt);

      if (expiresAt <= requiredAt) {
        ctx.addIssue({
          code: "custom",
          path: ["expiresAt"],
          message: "Expiration time must be after required time",
        });
      }
    }
  });

// Update Status

export const UpdateBloodRequestStatusSchema = z
  .object({
    status: BloodRequestStatusSchema,
  })
  .strict();

// Response

export const BloodRequestSchema = z.object({
  id: z.uuid(),
  requesterId: z.uuid(),
  locationId: z.uuid().nullable(),
  bloodGroup: BloodGroupSchema,
  unitsRequired: z.number().int(),
  unitsFulfilled: z.number().int(),
  priority: PrioritySchema,
  status: BloodRequestStatusSchema,
  patientName: z.string().nullable(),
  hospitalName: z.string().nullable(),
  requiredAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types

export type CreateBloodRequestInput = z.infer<typeof CreateBloodRequestSchema>;
export type UpdateBloodRequestInput = z.infer<typeof UpdateBloodRequestSchema>;
export type UpdateBloodRequestStatusInput = z.infer<
  typeof UpdateBloodRequestStatusSchema
>;
export type BloodRequestResponse = z.infer<typeof BloodRequestSchema>;
