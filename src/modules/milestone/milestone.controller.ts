import httpStatus from "http-status";

import type { Request, Response } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import {
  CreateMilestoneSchema,
  MilestoneQuerySchema,
  UpdateMilestoneSchema,
  UserMilestoneQuerySchema,
} from "./milestone.schema";
import { MilestoneService } from "./milestone.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// Public

const getMilestones = catchAsync(async (req: Request, res: Response) => {
  const query = MilestoneQuerySchema.parse(req.query);

  const result = await MilestoneService.getMilestones(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Milestones retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMilestoneById = catchAsync(async (req: Request, res: Response) => {
  const milestone = await MilestoneService.getMilestone(
    req.params.milestoneId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Milestone retrieved successfully",
    data: milestone,
  });
});

// Current User

const getMyMilestones = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const query = UserMilestoneQuerySchema.parse(req.query);

  const result = await MilestoneService.getMyMilestones(user.id, query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your milestones retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// Moderator / Admin

const getUserMilestones = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const query = UserMilestoneQuerySchema.parse(req.query);

  const result = await MilestoneService.getUserMilestones(
    user.id,
    req.params.userId as string,
    query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User milestones retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// Admin

const createMilestone = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const input = CreateMilestoneSchema.parse(req.body);

  const milestone = await MilestoneService.createMilestone(user.id, input);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Milestone created successfully",
    data: milestone,
  });
});

const updateMilestone = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);
  const input = UpdateMilestoneSchema.parse(req.body);

  const milestone = await MilestoneService.updateMilestone(
    user.id,
    req.params.milestoneId as string,
    input,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Milestone updated successfully",
    data: milestone,
  });
});

const deleteMilestone = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await MilestoneService.deleteMilestone(
    user.id,
    req.params.milestoneId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Milestone deleted successfully",
    data: null,
  });
});

export const MilestoneController = {
  getMilestones,
  getMilestoneById,
  getMyMilestones,
  getUserMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
