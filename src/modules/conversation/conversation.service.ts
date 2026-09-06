import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  AddParticipantInput,
  CreateConversationInput,
} from "./conversation.schema";

// User

const getUserById = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

// Conversation

const getConversation = async (conversationId: string) => {
  const conversation = await db.orm.public.Conversation.where({
    id: conversationId,
  }).first();

  if (!conversation) {
    throw new AppError("Conversation not found", httpStatus.NOT_FOUND);
  }

  return conversation;
};

// Participant

const getParticipant = async (conversationId: string, userId: string) => {
  return db.orm.public.ConversationParticipant.where({
    conversationId,
    userId,
  }).first();
};

const requireParticipant = async (conversationId: string, userId: string) => {
  const participant = await getParticipant(conversationId, userId);

  if (!participant) {
    throw new AppError(
      "You are not a participant of this conversation",
      httpStatus.FORBIDDEN,
    );
  }

  return participant;
};

// Validate Users

const validateUsers = async (userIds: string[]) => {
  const uniqueIds = [...new Set(userIds)];

  const users = await Promise.all(
    uniqueIds.map((userId) =>
      db.orm.public.User.where({
        id: userId,
      }).first(),
    ),
  );

  const hasMissingUser = users.some((user) => user === undefined);

  if (hasMissingUser) {
    throw new AppError(
      "One or more users were not found",
      httpStatus.NOT_FOUND,
    );
  }
};

// Create Conversation

const createConversation = async (
  creatorId: string,
  data: CreateConversationInput,
) => {
  const participantIds = [creatorId, ...data.participantIds];

  const uniqueParticipantIds = [...new Set(participantIds)];

  // Validate all users in parallel.
  await validateUsers(uniqueParticipantIds);

  // ==========================================================
  // Direct Conversation
  // ==========================================================

  if (data.type === "direct") {
    if (uniqueParticipantIds.length !== 2) {
      throw new AppError(
        "A direct conversation must have exactly two participants",
        httpStatus.BAD_REQUEST,
      );
    }

    const otherUserId = uniqueParticipantIds.find((id) => id !== creatorId);

    if (!otherUserId) {
      throw new AppError(
        "A direct conversation requires another participant",
        httpStatus.BAD_REQUEST,
      );
    }

    const existingParticipants =
      await db.orm.public.ConversationParticipant.where({
        userId: creatorId,
      }).all();

    // Check possible direct conversations in parallel.
    const existingConversations = await Promise.all(
      existingParticipants.map(async (participant) => {
        const conversation = await db.orm.public.Conversation.where({
          id: participant.conversationId,
          type: "direct",
        }).first();

        if (!conversation) {
          return undefined;
        }

        const otherParticipant = await getParticipant(
          conversation.id,
          otherUserId,
        );

        return otherParticipant ? conversation : undefined;
      }),
    );

    const existingConversation = existingConversations.find(
      (conversation) => conversation !== undefined,
    );

    if (existingConversation) {
      return existingConversation;
    }
  }

  // ==========================================================
  // Create Conversation
  // ==========================================================

  const conversation = await db.orm.public.Conversation.create({
    type: data.type,
  });

  // ==========================================================
  // Create Participants
  // ==========================================================

  const joinedAt = new Date().toISOString();

  await Promise.all(
    uniqueParticipantIds.map((userId) =>
      db.orm.public.ConversationParticipant.create({
        conversationId: conversation.id,
        userId,
        joinedAt,
      }),
    ),
  );

  return conversation;
};

// Get My Conversations

const getMyConversations = async (userId: string) => {
  await getUserById(userId);

  const participants = await db.orm.public.ConversationParticipant.where({
    userId,
  }).all();

  if (participants.length === 0) {
    return [];
  }

  const conversations = await Promise.all(
    participants.map((participant) =>
      getConversation(participant.conversationId),
    ),
  );

  return conversations.toSorted((a, b) =>
    Temporal.Instant.compare(b.updatedAt, a.updatedAt),
  );
};

// Get Conversation For User

const getConversationForUser = async (
  conversationId: string,
  userId: string,
) => {
  const [conversation] = await Promise.all([
    getConversation(conversationId),
    requireParticipant(conversationId, userId),
  ]);

  return conversation;
};

// Add Participant

const addParticipant = async (
  conversationId: string,
  requesterId: string,
  data: AddParticipantInput,
) => {
  const conversation = await getConversation(conversationId);

  await requireParticipant(conversationId, requesterId);

  // Direct conversations cannot have more participants.

  if (conversation.type === "direct") {
    throw new AppError(
      "Participants cannot be added to a direct conversation",
      httpStatus.BAD_REQUEST,
    );
  }

  // Cannot add yourself.

  if (data.userId === requesterId) {
    throw new AppError(
      "You are already a participant of this conversation",
      httpStatus.BAD_REQUEST,
    );
  }

  // Validate target user.

  await getUserById(data.userId);

  // Prevent duplicate participant.

  const existingParticipant = await getParticipant(conversationId, data.userId);

  if (existingParticipant) {
    throw new AppError("User is already a participant", httpStatus.CONFLICT);
  }

  // Add participant.

  return db.orm.public.ConversationParticipant.create({
    conversationId,
    userId: data.userId,
    joinedAt: new Date().toISOString(),
  });
};

// Remove Participant

const removeParticipant = async (
  conversationId: string,
  requesterId: string,
  userId: string,
) => {
  const conversation = await getConversation(conversationId);

  await requireParticipant(conversationId, requesterId);

  // Cannot remove yourself.

  if (userId === requesterId) {
    throw new AppError(
      "Use the leave endpoint to leave the conversation",
      httpStatus.BAD_REQUEST,
    );
  }

  // Direct conversations cannot remove participants.

  if (conversation.type === "direct") {
    throw new AppError(
      "Participants cannot be removed from a direct conversation",
      httpStatus.BAD_REQUEST,
    );
  }

  // Find participant.

  const participant = await getParticipant(conversationId, userId);

  if (!participant) {
    throw new AppError("Participant not found", httpStatus.NOT_FOUND);
  }

  // Remove participant.

  await db.orm.public.ConversationParticipant.where({
    id: participant.id,
  }).delete();
};

// Leave Conversation

const leaveConversation = async (conversationId: string, userId: string) => {
  const participant = await requireParticipant(conversationId, userId);

  await db.orm.public.ConversationParticipant.where({
    id: participant.id,
  }).delete();
};

// Is Participant

const isParticipant = async (conversationId: string, userId: string) => {
  const participant = await getParticipant(conversationId, userId);

  return participant !== undefined;
};

// Export

export const ConversationService = {
  createConversation,
  getMyConversations,
  getConversationForUser,
  addParticipant,
  removeParticipant,
  leaveConversation,
  isParticipant,
  requireParticipant,
};
