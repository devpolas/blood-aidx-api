import type { Request, Response } from "express";
import httpStatus from "http-status";

import {
  AddParticipantSchema,
  CreateConversationSchema,
} from "./conversation.schema";
import { ConversationService } from "./conversation.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createConversation = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const data = CreateConversationSchema.parse(req.body);

  const result = await ConversationService.createConversation(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Conversation created successfully",
    data: result,
  });
});

const getMyConversations = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await ConversationService.getMyConversations(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Conversations retrieved successfully",
    data: result,
  });
});

const getConversation = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await ConversationService.getConversationForUser(
    req.params.conversationId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Conversation retrieved successfully",
    data: result,
  });
});

const addParticipant = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const data = AddParticipantSchema.parse(req.body);

  const result = await ConversationService.addParticipant(
    req.params.conversationId as string,
    user.id,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Participant added successfully",
    data: result,
  });
});

const removeParticipant = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await ConversationService.removeParticipant(
    req.params.conversationId as string,
    user.id,
    req.params.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Participant removed successfully",
  });
});

const leaveConversation = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await ConversationService.leaveConversation(
    req.params.conversationId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Left conversation successfully",
  });
});

export const ConversationController = {
  createConversation,
  getMyConversations,
  getConversation,
  addParticipant,
  removeParticipant,
  leaveConversation,
};
