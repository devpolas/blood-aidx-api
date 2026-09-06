import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";
import { ConversationService } from "../conversation/conversation.service";

import type { CreateMessageInput, UpdateMessageInput } from "./message.schema";

type GlobalRole =
  | "donor"
  | "recipient"
  | "volunteer"
  | "hospital"
  | "blood_bank"
  | "moderator"
  | "admin";

// Internal Helpers

const getMessage = async (messageId: string) => {
  const message = await db.orm.public.Message.where({
    id: messageId,
  }).first();

  if (!message) {
    throw new AppError("Message not found", httpStatus.NOT_FOUND);
  }

  return message;
};

const getParticipant = async (conversationId: string, userId: string) => {
  const participant = await db.orm.public.ConversationParticipant.where({
    conversationId,
    userId,
  }).first();

  if (!participant) {
    throw new AppError(
      "Conversation participant not found",
      httpStatus.NOT_FOUND,
    );
  }

  return participant;
};

const getUser = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

const requireModeratorOrAdmin = async (userId: string) => {
  const user = await getUser(userId);

  const role = user.role as GlobalRole;

  if (role !== "moderator" && role !== "admin") {
    throw new AppError(
      "Moderator or admin access required",
      httpStatus.FORBIDDEN,
    );
  }

  return user;
};

const requireMessageSender = (messageSenderId: string, userId: string) => {
  if (messageSenderId !== userId) {
    throw new AppError(
      "Only the message sender can perform this action",
      httpStatus.FORBIDDEN,
    );
  }
};

// Send Message
// Participant only

const sendMessage = async (senderId: string, data: CreateMessageInput) => {
  await ConversationService.getConversationForUser(
    data.conversationId,
    senderId,
  );

  return db.orm.public.Message.create({
    conversationId: data.conversationId,
    senderId,
    content: data.content,
  });
};

// Get Conversation Messages
// Participant only

const getConversationMessages = async (
  conversationId: string,
  userId: string,
) => {
  await ConversationService.getConversationForUser(conversationId, userId);

  const messages = await db.orm.public.Message.where({
    conversationId,
  }).all();

  return messages.toSorted((a, b) =>
    Temporal.Instant.compare(a.createdAt, b.createdAt),
  );
};

// Get Message
// Participant only

const getMessageByIdForUser = async (messageId: string, userId: string) => {
  const message = await getMessage(messageId);

  await ConversationService.getConversationForUser(
    message.conversationId,
    userId,
  );

  return message;
};

// Update Message
// Sender only

const updateMessage = async (
  messageId: string,
  userId: string,
  data: UpdateMessageInput,
) => {
  const message = await getMessage(messageId);

  await ConversationService.getConversationForUser(
    message.conversationId,
    userId,
  );

  requireMessageSender(message.senderId, userId);

  return db.orm.public.Message.where({
    id: messageId,
  }).update({
    content: data.content,
    isEdited: true,
    editedAt: new Date().toDateString(),
  });
};

// Delete Message
// Sender only

const deleteMessage = async (messageId: string, userId: string) => {
  const message = await getMessage(messageId);

  await ConversationService.getConversationForUser(
    message.conversationId,
    userId,
  );

  requireMessageSender(message.senderId, userId);

  await db.orm.public.Message.where({
    id: messageId,
  }).delete();
};

// Moderate Delete Message
// Moderator / Admin only

const moderateDeleteMessage = async (
  messageId: string,
  moderatorId: string,
) => {
  await requireModeratorOrAdmin(moderatorId);

  const message = await getMessage(messageId);

  await db.orm.public.Message.where({
    id: message.id,
  }).delete();
};

// Mark Conversation Messages As Read
// Participant only

const markConversationMessagesAsRead = async (
  conversationId: string,
  userId: string,
) => {
  await ConversationService.getConversationForUser(conversationId, userId);

  const participant = await getParticipant(conversationId, userId);

  const lastReadAt = new Date().toISOString();

  await db.orm.public.ConversationParticipant.where({
    id: participant.id,
  }).update({
    lastReadAt,
  });

  return {
    lastReadAt,
  };
};

// Mark Individual Message As Read
// Participant only
//
// NOTE:
// The current read model tracks conversation-level read state.
// Therefore this marks the conversation as read up to now.

const markMessageAsRead = async (messageId: string, userId: string) => {
  const message = await getMessage(messageId);

  await markConversationMessagesAsRead(message.conversationId, userId);

  return message;
};

// Get Unread Count
// Participant only

const getUnreadCount = async (conversationId: string, userId: string) => {
  await ConversationService.getConversationForUser(conversationId, userId);

  const participant = await getParticipant(conversationId, userId);

  const messages = await db.orm.public.Message.where({
    conversationId,
  }).all();

  const unreadCount = messages.filter((message) => {
    // Never count own messages.
    if (message.senderId === userId) {
      return false;
    }

    // Never read anything yet.
    if (participant.lastReadAt === null) {
      return true;
    }

    return (
      Temporal.Instant.compare(message.createdAt, participant.lastReadAt) > 0
    );
  }).length;

  return {
    count: unreadCount,
  };
};

// Export

export const MessageService = {
  sendMessage,
  getConversationMessages,
  getMessageByIdForUser,
  updateMessage,
  deleteMessage,
  moderateDeleteMessage,
  markMessageAsRead,
  markConversationMessagesAsRead,
  getUnreadCount,
};
