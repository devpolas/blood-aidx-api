import * as z from "zod";

export const OrganizationTypeSchema = z.enum([
  "hospital",
  "blood_bank",
  "clinic",
  "ngo",
  "other",
]);

export const OrganizationStatusSchema = z.enum([
  "pending",
  "active",
  "verified",
  "suspended",
  "rejected",
]);

export const OrganizationMemberRoleSchema = z.enum([
  "admin",
  "staff",
  "verifier",
]);

export const CreateOrganizationSchema = z
  .object({
    name: z.string().trim().min(2).max(200),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers and hyphens",
      ),

    type: OrganizationTypeSchema,
    locationId: z.uuid().optional(),
    description: z.string().trim().max(2000).optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    email: z.email().optional(),
    website: z.url().optional(),
  })
  .strict();

export const UpdateOrganizationSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),

    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers and hyphens",
      )
      .optional(),

    type: OrganizationTypeSchema.optional(),
    locationId: z.uuid().nullable().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    phone: z.string().trim().min(7).max(20).nullable().optional(),
    email: z.email().nullable().optional(),
    website: z.url().nullable().optional(),
  })
  .strict();

export const UpdateOrganizationStatusSchema = z
  .object({
    status: OrganizationStatusSchema,
  })
  .strict();

export const AddOrganizationMemberSchema = z
  .object({
    userId: z.uuid(),

    role: OrganizationMemberRoleSchema.default("staff"),
  })
  .strict();

export const UpdateOrganizationMemberSchema = z
  .object({
    role: OrganizationMemberRoleSchema,
  })
  .strict();

export const OrganizationSchema = z.object({
  id: z.uuid(),
  ownerId: z.uuid(),
  locationId: z.uuid().nullable(),
  name: z.string(),
  slug: z.string(),

  type: OrganizationTypeSchema,
  status: OrganizationStatusSchema,

  description: z.string().nullable(),

  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),

  verifiedById: z.uuid().nullable(),

  verifiedAt: z.string().nullable(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type UpdateOrganizationStatusInput = z.infer<
  typeof UpdateOrganizationStatusSchema
>;
export type AddOrganizationMemberInput = z.infer<
  typeof AddOrganizationMemberSchema
>;
export type UpdateOrganizationMemberInput = z.infer<
  typeof UpdateOrganizationMemberSchema
>;
export type OrganizationResponse = z.infer<typeof OrganizationSchema>;
