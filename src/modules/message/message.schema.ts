import * as z from "zod";

// Create Message

export const CreateMessageSchema = z
  .object({
    conversationId: z.uuid(),
    content: z.string().trim().min(1).max(5000),
  })
  .strict();

// Update Message

export const UpdateMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
  })
  .strict();

// Message Response

export const MessageSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  senderId: z.uuid(),
  content: z.string(),
  isEdited: z.boolean(),
  editedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type UpdateMessageInput = z.infer<typeof UpdateMessageSchema>;
export type MessageResponse = z.infer<typeof MessageSchema>;
