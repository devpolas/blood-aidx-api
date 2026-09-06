import * as z from "zod";

import { GenderSchema } from "../auth/auth.schema";

export const UpdateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    image: z.string().url().nullable().optional(),
    gender: GenderSchema.nullable().optional(),
  })
  .strict();

export const UserIdSchema = z.object({
  id: z.uuid(),
});

export const UserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string(),
  gender: GenderSchema.nullable(),
  banned: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserResponse = z.infer<typeof UserSchema>;
