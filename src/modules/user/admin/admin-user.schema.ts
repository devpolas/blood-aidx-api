import * as z from "zod";

import { GenderSchema } from "../../auth/auth.schema";

export const AdminAssignableRoleSchema = z.enum(["user", "moderator"]);

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

export const AdminUserSortBySchema = z.enum([
  "createdAt",
  "updatedAt",
  "name",
  "email",
  "role",
]);

export const AdminUserQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
    role: z.enum(["user", "moderator", "admin"]).optional(),
    banned: z.coerce.boolean().optional(),
    emailVerified: z.coerce.boolean().optional(),
    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),
    sortBy: AdminUserSortBySchema.default("createdAt"),
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

export type AdminUserQueryInput = z.infer<typeof AdminUserQuerySchema>;
