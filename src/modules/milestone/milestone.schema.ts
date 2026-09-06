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

// Response

export const MilestoneSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  donationCount: z.number(),
  badgeUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types

export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;
export type MilestoneResponse = z.infer<typeof MilestoneSchema>;
