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

// Location
export const OrganizationLocationSchema = z
  .object({
    latitude: z
      .string()
      .regex(/^-?\d+(.\d+)?$/, "Please enter a valid latitude")
      .refine((value) => Number(value) >= -90 && Number(value) <= 90, {
        message: "Latitude must be between -90 and 90",
      })
      .optional(),

    longitude: z
      .string()
      .regex(/^-?\d+(\.\d+)?$/, "Please enter a valid longitude")
      .refine((value) => Number(value) >= -180 && Number(value) <= 180, {
        message: "Longitude must be between -180 and 180",
      })
      .optional(),

    country: z
      .string()
      .trim()
      .min(1, "Please enter your country")
      .max(100, "Country must be at most 100 characters"),

    division: z
      .string()
      .trim()
      .min(1, "Please enter your division")
      .max(100, "Division must be at most 100 characters"),

    city: z
      .string()
      .trim()
      .min(1, "Please enter your city")
      .max(100, "City must be at most 100 characters"),

    village: z
      .string()
      .trim()
      .min(1, "Please enter your village or area")
      .max(100, "Village must be at most 100 characters"),

    postalCode: z
      .string()
      .trim()
      .min(1, "Please enter your postal code")
      .max(20, "Postal code must be at most 20 characters"),

    addressLine: z
      .string()
      .trim()
      .max(255, "Address must be at most 255 characters")
      .optional(),
  })
  .strict();

// Create
export const CreateOrganizationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Organization name must be at least 2 characters")
      .max(200, "Organization name must be at most 200 characters"),

    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .max(100, "Slug must be at most 100 characters")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers and hyphens",
      ),

    type: OrganizationTypeSchema,
    location: OrganizationLocationSchema,

    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters")
      .optional(),

    phone: z
      .string()
      .trim()
      .min(7, "Phone must be at least 7 characters")
      .max(20, "Phone must be at most 20 characters")
      .optional(),

    email: z.email().optional(),
    website: z.url().optional(),

    registrationNo: z
      .string()
      .trim()
      .min(1, "Registration number cannot be empty")
      .max(100, "Registration number must be at most 100 characters")
      .optional(),
  })
  .strict();

// Update
export const UpdateOrganizationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Organization name must be at least 2 characters")
      .max(200, "Organization name must be at most 200 characters")
      .optional(),

    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .max(100, "Slug must be at most 100 characters")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers and hyphens",
      )
      .optional(),

    type: OrganizationTypeSchema.optional(),

    // A complete location is required when updating the location.
    location: OrganizationLocationSchema.optional(),

    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters")
      .nullable()
      .optional(),

    phone: z
      .string()
      .trim()
      .min(7, "Phone must be at least 7 characters")
      .max(20, "Phone must be at most 20 characters")
      .nullable()
      .optional(),

    email: z.email().nullable().optional(),
    website: z.url().nullable().optional(),

    registrationNo: z
      .string()
      .trim()
      .min(1, "Registration number cannot be empty")
      .max(100, "Registration number must be at most 100 characters")
      .nullable()
      .optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

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

const OrganizationTypesQuerySchema = z
  .string()
  .trim()
  .transform((value) =>
    value
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean),
  )
  .pipe(z.array(OrganizationTypeSchema).min(1))
  .optional();

export const OrganizationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),

    types: OrganizationTypesQuerySchema,
    status: OrganizationStatusSchema.optional(),
    locationId: z.uuid().optional(),

    country: z.string().trim().min(1).max(100).optional(),
    division: z.string().trim().min(1).max(100).optional(),
    city: z.string().trim().min(1).max(100).optional(),

    createdAtFrom: z.iso.datetime().optional(),
    createdAtTo: z.iso.datetime().optional(),

    sortBy: OrganizationSortBySchema.default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.createdAtFrom || !data.createdAtTo) {
      return;
    }

    if (new Date(data.createdAtTo) < new Date(data.createdAtFrom)) {
      ctx.addIssue({
        code: "custom",
        path: ["createdAtTo"],
        message: "createdAtTo must be greater than or equal to createdAtFrom",
      });
    }
  });

// Response
export const OrganizationSchema = z
  .object({
    id: z.uuid(),
    ownerId: z.uuid(),
    locationId: z.uuid().nullable(),
    verifiedById: z.uuid().nullable(),

    name: z.string(),
    slug: z.string(),
    type: OrganizationTypeSchema,
    status: OrganizationStatusSchema,

    description: z.string().nullable(),
    logoUrl: z.string().nullable(),
    coverUrl: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    website: z.string().nullable(),
    registrationNo: z.string().nullable(),

    verifiedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

// Types
export type OrganizationLocationInput = z.infer<
  typeof OrganizationLocationSchema
>;
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
