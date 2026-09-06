import * as z from "zod";

// Conversation Type

export const ConversationTypeSchema = z.enum([
  "direct",
  "blood_request",
  "organization",
]);

// Create Conversation

export const CreateConversationSchema = z
  .object({
    type: ConversationTypeSchema,
    participantIds: z.array(z.uuid()).min(1).max(50),
  })
  .strict()
  .superRefine((data, ctx) => {
    const uniqueParticipantIds = new Set(data.participantIds);

    if (uniqueParticipantIds.size !== data.participantIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["participantIds"],
        message: "Duplicate participants are not allowed",
      });
    }
  });

// Add Participant

export const AddParticipantSchema = z
  .object({
    userId: z.uuid(),
  })
  .strict();

// Conversation Response

export const ConversationSchema = z.object({
  id: z.uuid(),
  type: ConversationTypeSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type AddParticipantInput = z.infer<typeof AddParticipantSchema>;
export type ConversationResponse = z.infer<typeof ConversationSchema>;
