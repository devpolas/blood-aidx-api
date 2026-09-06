import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { CreateMessageSchema, UpdateMessageSchema } from "./message.schema";
import { MessageService } from "./message.service";
import { requireAuth } from "../../middleware/auth.middleware";

const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = requireAuth(req);

    const data = CreateMessageSchema.parse(req.body);

    const result = await MessageService.sendMessage(user.id, data);

    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Message sent successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getConversationMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await MessageService.getConversationMessages(
      req.params.conversationId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMessageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await MessageService.getMessageByIdForUser(
      req.params.messageId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = UpdateMessageSchema.parse(req.body);

    const result = await MessageService.updateMessage(
      req.params.messageId as string,
      user.id,
      data,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Message updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    await MessageService.deleteMessage(req.params.messageId as string, user.id);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const markMessageAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await MessageService.markMessageAsRead(
      req.params.messageId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Message marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markConversationMessagesAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await MessageService.markConversationMessagesAsRead(
      req.params.conversationId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Conversation messages marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await MessageService.getUnreadCount(
      req.params.conversationId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const MessageController = {
  sendMessage,
  getConversationMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  markMessageAsRead,
  markConversationMessagesAsRead,
  getUnreadCount,
};
