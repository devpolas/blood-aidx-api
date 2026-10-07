import * as z from "zod";

// Enums

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

// Create

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

// Update

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

// Status

export const UpdateOrganizationStatusSchema = z
  .object({
    status: OrganizationStatusSchema,
  })
  .strict();

// Members

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

// Query

export const OrganizationSortBySchema = z.enum([
  "createdAt",
  "updatedAt",
  "name",
  "type",
  "status",
]);

export const OrganizationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
    type: OrganizationTypeSchema.optional(),
    status: OrganizationStatusSchema.optional(),
    locationId: z.uuid().optional(),
    country: z.string().trim().min(1).max(100).optional(),
    division: z.string().trim().min(1).max(100).optional(),
    district: z.string().trim().min(1).max(100).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),
    sortBy: OrganizationSortBySchema.default("createdAt"),
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

// Response

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

// Types

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
export type OrganizationQueryInput = z.infer<typeof OrganizationQuerySchema>;
export type OrganizationResponse = z.infer<typeof OrganizationSchema>;
