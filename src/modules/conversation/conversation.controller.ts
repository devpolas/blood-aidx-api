import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import {
  AddParticipantSchema,
  CreateConversationSchema,
} from "./conversation.schema";

import { ConversationService } from "./conversation.service";

export const ConversationController = {
  // Create

  createConversation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = CreateConversationSchema.parse(req.body);

    const conversation = await ConversationService.createConversation(
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Conversation created successfully",
      statusCode: httpStatus.CREATED,
      data: {
        conversation,
      },
    });
  }),

  // Current User

  getMyConversations: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const conversations = await ConversationService.getMyConversations(user.id);

    sendResponse(res, {
      success: true,
      message: "Conversations retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        conversations,
      },
    });
  }),

  getConversation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const conversation = await ConversationService.getConversationForUser(
      req.params.conversationId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Conversation retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        conversation,
      },
    });
  }),

  // Participants

  addParticipant: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = AddParticipantSchema.parse(req.body);

    const participant = await ConversationService.addParticipant(
      req.params.conversationId as string,
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Participant added successfully",
      statusCode: httpStatus.OK,
      data: {
        participant,
      },
    });
  }),

  removeParticipant: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await ConversationService.removeParticipant(
      req.params.conversationId as string,
      user.id,
      req.params.userId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Participant removed successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  // Leave

  leaveConversation: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await ConversationService.leaveConversation(
      req.params.conversationId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Left conversation successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
