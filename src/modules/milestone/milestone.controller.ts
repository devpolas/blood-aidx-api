import httpStatus from "http-status";

import type { Request, Response } from "express";

import { requireAuth } from "../../middleware/auth.middleware";

import {
  CreateMilestoneSchema,
  UpdateMilestoneSchema,
} from "./milestone.schema";

import { MilestoneService } from "./milestone.service";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// Public

const getMilestones = catchAsync(async (_req: Request, res: Response) => {
  const milestones = await MilestoneService.getMilestones();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Milestones retrieved successfully",
    data: milestones,
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

  const milestones = await MilestoneService.getMyMilestones(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your milestones retrieved successfully",
    data: milestones,
  });
});

// Moderator / Admin

const getUserMilestones = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const milestones = await MilestoneService.getUserMilestones(
    user.id,
    req.params.userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User milestones retrieved successfully",
    data: milestones,
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
  });
});

// Export

export const MilestoneController = {
  getMilestones,
  getMilestoneById,
  getMyMilestones,
  getUserMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
