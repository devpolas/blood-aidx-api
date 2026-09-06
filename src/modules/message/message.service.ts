import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";
import { ConversationService } from "../conversation/conversation.service";

import type { CreateMessageInput, UpdateMessageInput } from "./message.schema";

// Get Message

const getMessage = async (messageId: string) => {
  const message = await db.orm.public.Message.where({
    id: messageId,
  }).first();

  if (!message) {
    throw new AppError("Message not found", httpStatus.NOT_FOUND);
  }

  return message;
};

// Send Message

const sendMessage = async (senderId: string, data: CreateMessageInput) => {
  // Ensures the sender belongs to the conversation.
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

const getConversationMessages = async (
  conversationId: string,
  userId: string,
) => {
  // Ensures the user belongs to the conversation.
  await ConversationService.getConversationForUser(conversationId, userId);

  const messages = await db.orm.public.Message.where({
    conversationId,
  }).all();

  return messages.toSorted(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

// Get Message By ID For User

const getMessageByIdForUser = async (messageId: string, userId: string) => {
  const message = await getMessage(messageId);

  // Ensures the user belongs to the message conversation.
  await ConversationService.getConversationForUser(
    message.conversationId,
    userId,
  );

  return message;
};

// Update Message

const updateMessage = async (
  messageId: string,
  userId: string,
  data: UpdateMessageInput,
) => {
  const message = await getMessage(messageId);

  // Ensures the user belongs to the conversation.
  await ConversationService.getConversationForUser(
    message.conversationId,
    userId,
  );

  // Only the sender can edit their message.
  if (message.senderId !== userId) {
    throw new AppError(
      "Only the message sender can edit this message",
      httpStatus.FORBIDDEN,
    );
  }

  return db.orm.public.Message.where({
    id: messageId,
  }).update({
    content: data.content,
    isEdited: true,
    editedAt: new Date().toISOString(),
  });
};

// Delete Message

const deleteMessage = async (messageId: string, userId: string) => {
  const message = await getMessage(messageId);

  // Ensures the user belongs to the conversation.
  await ConversationService.getConversationForUser(
    message.conversationId,
    userId,
  );

  // Only the sender can delete their message.
  if (message.senderId !== userId) {
    throw new AppError(
      "Only the message sender can delete this message",
      httpStatus.FORBIDDEN,
    );
  }

  await db.orm.public.Message.where({
    id: messageId,
  }).delete();
};

// Mark Conversation As Read

const markConversationMessagesAsRead = async (
  conversationId: string,
  userId: string,
) => {
  // Ensures the user belongs to the conversation.
  await ConversationService.getConversationForUser(conversationId, userId);

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

  const now = new Date().toISOString();

  // Read state belongs to the participant,
  // not to individual messages.
  await db.orm.public.ConversationParticipant.where({
    conversationId,
    userId,
  }).update({
    lastReadAt: now,
  });

  return {
    lastReadAt: now,
  };
};

// Mark Individual Message As Read

const markMessageAsRead = async (messageId: string, userId: string) => {
  const message = await getMessage(messageId);

  await markConversationMessagesAsRead(message.conversationId, userId);

  return message;
};

// Get Unread Count

const getUnreadCount = async (conversationId: string, userId: string) => {
  await ConversationService.getConversationForUser(conversationId, userId);

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

  const messages = await db.orm.public.Message.where({
    conversationId,
  }).all();

  const unreadCount = messages.filter((message) => {
    // Never count the user's own messages.
    if (message.senderId === userId) {
      return false;
    }

    // If the user has never read the conversation,
    // every message from other users is unread.
    if (participant.lastReadAt === null) {
      return true;
    }

    return (
      new Date(message.createdAt).getTime() >
      new Date(participant.lastReadAt).getTime()
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
  markMessageAsRead,
  markConversationMessagesAsRead,
  getUnreadCount,
};
