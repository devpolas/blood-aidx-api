import * as z from "zod";

export const LocationCreateSchema = z.object({
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  country: z.string().min(1).max(100),
  division: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  village: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  addressLine: z.string().optional(),
});

export const LocationUpdateSchema = LocationCreateSchema.partial();

export type LocationCreateInput = z.infer<typeof LocationCreateSchema>;
export type LocationUpdateInput = z.infer<typeof LocationUpdateSchema>;
