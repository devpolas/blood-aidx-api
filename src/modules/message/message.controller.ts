import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CreateMessageSchema, UpdateMessageSchema } from "./message.schema";
import { MessageService } from "./message.service";

export const MessageController = {
  // Create

  sendMessage: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = CreateMessageSchema.parse(req.body);

    const message = await MessageService.sendMessage(user.id, data);

    sendResponse(res, {
      success: true,
      message: "Message sent successfully",
      statusCode: httpStatus.CREATED,
      data: {
        message,
      },
    });
  }),

  // Current User

  getConversationMessages: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const messages = await MessageService.getConversationMessages(
      req.params.conversationId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Conversation messages retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        messages,
      },
    });
  }),

  getMessageById: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const message = await MessageService.getMessageByIdForUser(
      req.params.messageId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Message retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        message,
      },
    });
  }),

  getUnreadCount: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const count = await MessageService.getUnreadCount(
      req.params.conversationId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Unread message count retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        count,
      },
    });
  }),

  // Read

  markMessageAsRead: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const message = await MessageService.markMessageAsRead(
      req.params.messageId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Message marked as read",
      statusCode: httpStatus.OK,
      data: {
        message,
      },
    });
  }),

  markConversationMessagesAsRead: catchAsync(
    async (req: Request, res: Response) => {
      const { user } = requireAuth(req);

      const messages = await MessageService.markConversationMessagesAsRead(
        req.params.conversationId as string,
        user.id,
      );

      sendResponse(res, {
        success: true,
        message: "Conversation messages marked as read",
        statusCode: httpStatus.OK,
        data: {
          messages,
        },
      });
    },
  ),

  // Update

  updateMessage: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateMessageSchema.parse(req.body);

    const message = await MessageService.updateMessage(
      req.params.messageId as string,
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Message updated successfully",
      statusCode: httpStatus.OK,
      data: {
        message,
      },
    });
  }),

  // Delete

  deleteMessage: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await MessageService.deleteMessage(req.params.messageId as string, user.id);

    sendResponse(res, {
      success: true,
      message: "Message deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  // Moderator / Admin

  moderateDeleteMessage: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await MessageService.moderateDeleteMessage(
      req.params.messageId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Message removed by moderation",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
