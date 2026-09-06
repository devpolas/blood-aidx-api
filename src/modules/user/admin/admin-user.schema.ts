import * as z from "zod";

import { GenderSchema } from "../../auth/auth.schema";

export const AdminAssignableRoleSchema = z.enum([
  "donor",
  "recipient",
  "volunteer",
  "hospital",
  "blood_bank",
  "moderator",
]);

export const AdminUpdateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    image: z.url().nullable().optional(),
    gender: GenderSchema.nullable().optional(),
  })
  .strict();

export const AdminUpdateUserRoleSchema = z
  .object({
    role: AdminAssignableRoleSchema,
  })
  .strict();

export const BanUserSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
    expiresAt: z.iso.datetime().nullable().optional(),
  })
  .strict();

export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;

export type AdminUpdateUserRoleInput = z.infer<
  typeof AdminUpdateUserRoleSchema
>;

export type BanUserInput = z.infer<typeof BanUserSchema>;
