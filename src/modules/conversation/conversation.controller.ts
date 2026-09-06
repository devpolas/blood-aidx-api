import type { NextFunction, Request, Response } from "express";

import httpStatus from "http-status";

import {
  AddParticipantSchema,
  CreateConversationSchema,
} from "./conversation.schema";

import { ConversationService } from "./conversation.service";

import { requireAuth } from "../../middleware/auth.middleware";

// Create Conversation

const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = CreateConversationSchema.parse(req.body);

    const result = await ConversationService.createConversation(user.id, data);

    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Conversation created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get My Conversations

const getMyConversations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await ConversationService.getMyConversations(user.id);

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get Conversation

const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await ConversationService.getConversationForUser(
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

// Add Participant

const addParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = AddParticipantSchema.parse(req.body);

    const result = await ConversationService.addParticipant(
      req.params.conversationId as string,
      user.id,
      data,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Participant added successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Remove Participant

const removeParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    await ConversationService.removeParticipant(
      req.params.conversationId as string,
      user.id,
      req.params.userId as string,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Participant removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Leave Conversation

const leaveConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    await ConversationService.leaveConversation(
      req.params.conversationId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Left conversation successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Export

export const ConversationController = {
  createConversation,
  getMyConversations,
  getConversation,
  addParticipant,
  removeParticipant,
  leaveConversation,
};
