import * as z from "zod";

// Create

export const CreateMilestoneSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().min(1).max(1000),
    donationCount: z.number().int().positive().max(100000),
    badgeUrl: z.url().optional(),
  })
  .strict();

// Update

export const UpdateMilestoneSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    donationCount: z.number().int().positive().max(100000).optional(),
    badgeUrl: z.url().nullable().optional(),
  })
  .strict();

// Milestone Query

export const MilestoneSortBySchema = z.enum([
  "createdAt",
  "updatedAt",
  "donationCount",
  "name",
]);

export const MilestoneQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: MilestoneSortBySchema.default("donationCount"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

// User Milestone Query

export const UserMilestoneQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

// Response

export const MilestoneSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  donationCount: z.number().int(),
  badgeUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types

export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;
export type MilestoneQueryInput = z.infer<typeof MilestoneQuerySchema>;
export type UserMilestoneQueryInput = z.infer<typeof UserMilestoneQuerySchema>;
export type MilestoneResponse = z.infer<typeof MilestoneSchema>;
