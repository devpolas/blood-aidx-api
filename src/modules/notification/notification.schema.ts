import * as z from "zod";

export const NotificationTypeSchema = z.enum([
  "blood_request",
  "donation",
  "donation_verified",
  "certificate",
  "milestone",
  "message",
  "system",
]);

export const CreateNotificationSchema = z
  .object({
    userId: z.uuid(),
    type: NotificationTypeSchema,
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(2000),
    data: z.json().optional(),
  })
  .strict();

export const NotificationSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  data: z.json().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type NotificationResponse = z.infer<typeof NotificationSchema>;
