import type { Request, Response } from "express";
import httpStatus from "http-status";

import { CreateMessageSchema, UpdateMessageSchema } from "./message.schema";
import { MessageService } from "./message.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// Send Message
const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const data = CreateMessageSchema.parse(req.body);

  const result = await MessageService.sendMessage(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});

// Get Conversation Messages
const getConversationMessages = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const result = await MessageService.getConversationMessages(
      req.params.conversationId as string,
      user.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Conversation messages retrieved successfully",
      data: result,
    });
  },
);

// Get Message By ID
const getMessageById = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await MessageService.getMessageByIdForUser(
    req.params.messageId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message retrieved successfully",
    data: result,
  });
});

// Update Message
// Sender only
const updateMessage = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const data = UpdateMessageSchema.parse(req.body);

  const result = await MessageService.updateMessage(
    req.params.messageId as string,
    user.id,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message updated successfully",
    data: result,
  });
});

// Delete Message
// Sender only
const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await MessageService.deleteMessage(req.params.messageId as string, user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message deleted successfully",
  });
});

// Moderate Delete Message
// Moderator / Admin
const moderateDeleteMessage = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await MessageService.moderateDeleteMessage(
      req.params.messageId as string,
      user.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Message removed by moderation",
    });
  },
);

// Mark Message As Read
const markMessageAsRead = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await MessageService.markMessageAsRead(
    req.params.messageId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message marked as read",
    data: result,
  });
});

// Mark Conversation As Read
const markConversationMessagesAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const result = await MessageService.markConversationMessagesAsRead(
      req.params.conversationId as string,
      user.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Conversation messages marked as read",
      data: result,
    });
  },
);

// Get Unread Count
const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await MessageService.getUnreadCount(
    req.params.conversationId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unread message count retrieved successfully",
    data: result,
  });
});

export const MessageController = {
  sendMessage,
  getConversationMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  moderateDeleteMessage,
  markMessageAsRead,
  markConversationMessagesAsRead,
  getUnreadCount,
};
