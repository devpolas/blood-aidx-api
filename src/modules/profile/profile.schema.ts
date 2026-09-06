import * as z from "zod";

export const UpdateProfileSchema = z
  .object({
    phone: z.string().trim().min(7).max(20).nullable().optional(),
    dateOfBirth: z.iso.datetime().nullable().optional(),
    bio: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export const ProfileSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ProfileResponse = z.infer<typeof ProfileSchema>;
