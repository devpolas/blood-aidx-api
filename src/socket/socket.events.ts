import type { AppServer, AppSocket } from "./socket.types";

import { SOCKET_ROOM } from "./socket.rooms";

import {
  CreateMessageSchema,
  UpdateMessageSchema,
} from "../modules/message/message.schema";

import { ConversationService } from "../modules/conversation/conversation.service";

import { MessageService } from "../modules/message/message.service";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
};

const requireConversationRoom = (
  socket: AppSocket,
  conversationId: string,
): void => {
  const room = SOCKET_ROOM.conversation(conversationId);

  if (!socket.rooms.has(room)) {
    throw new Error("You must join the conversation first");
  }
};

export const registerSocketEvents = (
  io: AppServer,
  socket: AppSocket,
): void => {
  const userId = socket.data.user.id;

  // Private User Room

  void socket.join(SOCKET_ROOM.user(userId));

  // Conversation: Join

  socket.on("conversation:join", async ({ conversationId }, callback) => {
    try {
      await ConversationService.getConversationForUser(conversationId, userId);

      await socket.join(SOCKET_ROOM.conversation(conversationId));

      callback?.({
        success: true,
        message: "Joined conversation",
      });
    } catch (error) {
      callback?.({
        success: false,
        error: getErrorMessage(error),
      });
    }
  });

  // Conversation: Leave

  socket.on("conversation:leave", async ({ conversationId }, callback) => {
    try {
      await ConversationService.getConversationForUser(conversationId, userId);

      await socket.leave(SOCKET_ROOM.conversation(conversationId));

      callback?.({
        success: true,
        message: "Left conversation",
      });
    } catch (error) {
      callback?.({
        success: false,
        error: getErrorMessage(error),
      });
    }
  });

  // Message: Send

  socket.on("message:send", async ({ conversationId, content }, callback) => {
    try {
      const parsed = CreateMessageSchema.safeParse({
        conversationId,
        content,
      });

      if (!parsed.success) {
        callback?.({
          success: false,
          error: "Invalid message data",
        });

        return;
      }

      requireConversationRoom(socket, parsed.data.conversationId);

      const message = await MessageService.sendMessage(userId, parsed.data);

      io.to(SOCKET_ROOM.conversation(parsed.data.conversationId)).emit(
        "message:new",
        message,
      );

      callback?.({
        success: true,
        data: message,
      });
    } catch (error) {
      callback?.({
        success: false,
        error: getErrorMessage(error),
      });
    }
  });

  // Message: Update

  socket.on("message:update", async ({ messageId, content }, callback) => {
    try {
      const parsed = UpdateMessageSchema.safeParse({
        content,
      });

      if (!parsed.success) {
        callback?.({
          success: false,
          error: "Invalid message data",
        });

        return;
      }

      const message = await MessageService.getMessageByIdForUser(
        messageId,
        userId,
      );

      requireConversationRoom(socket, message.conversationId);

      const updatedMessage = await MessageService.updateMessage(
        messageId,
        userId,
        parsed.data,
      );

      io.to(SOCKET_ROOM.conversation(message.conversationId)).emit(
        "message:updated",
        updatedMessage,
      );

      callback?.({
        success: true,
        data: updatedMessage,
      });
    } catch (error) {
      callback?.({
        success: false,
        error: getErrorMessage(error),
      });
    }
  });

  // Message: Delete

  socket.on("message:delete", async ({ messageId }, callback) => {
    try {
      const message = await MessageService.getMessageByIdForUser(
        messageId,
        userId,
      );

      requireConversationRoom(socket, message.conversationId);

      await MessageService.deleteMessage(messageId, userId);

      io.to(SOCKET_ROOM.conversation(message.conversationId)).emit(
        "message:deleted",
        {
          conversationId: message.conversationId,
          messageId: message.id,
        },
      );

      callback?.({
        success: true,
        message: "Message deleted",
      });
    } catch (error) {
      callback?.({
        success: false,
        error: getErrorMessage(error),
      });
    }
  });

  // Conversation: Read

  socket.on("conversation:read", async ({ conversationId }, callback) => {
    try {
      requireConversationRoom(socket, conversationId);

      const result = await MessageService.markConversationMessagesAsRead(
        conversationId,
        userId,
      );

      io.to(SOCKET_ROOM.conversation(conversationId)).emit(
        "conversation:read",
        {
          conversationId,
          userId,
          lastReadAt: result.lastReadAt,
        },
      );

      callback?.({
        success: true,
        data: result,
      });
    } catch (error) {
      callback?.({
        success: false,
        error: getErrorMessage(error),
      });
    }
  });

  // Typing: Start

  socket.on("typing:start", async ({ conversationId }) => {
    try {
      await ConversationService.getConversationForUser(conversationId, userId);

      requireConversationRoom(socket, conversationId);

      socket.to(SOCKET_ROOM.conversation(conversationId)).emit("typing:start", {
        conversationId,
        userId,
      });
    } catch {
      // Typing events intentionally fail silently.
    }
  });

  // Typing: Stop

  socket.on("typing:stop", async ({ conversationId }) => {
    try {
      await ConversationService.getConversationForUser(conversationId, userId);

      requireConversationRoom(socket, conversationId);

      socket.to(SOCKET_ROOM.conversation(conversationId)).emit("typing:stop", {
        conversationId,
        userId,
      });
    } catch {
      // Typing events intentionally fail silently.
    }
  });

  // Disconnect

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
};
