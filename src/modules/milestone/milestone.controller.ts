import httpStatus from "http-status";
import type { Request, Response } from "express";

import { requireAuth } from "../../middleware/auth.middleware";

import {
  CreateMilestoneSchema,
  UpdateMilestoneSchema,
} from "./milestone.schema";

import { MilestoneService } from "./milestone.service";

// Public

const getMilestones = async (_req: Request, res: Response) => {
  const milestones = await MilestoneService.getMilestones();

  res.status(httpStatus.OK).json({
    success: true,

    data: milestones,
  });
};

const getMilestoneById = async (req: Request, res: Response) => {
  const milestone = await MilestoneService.getMilestone(
    req.params.milestoneId as string,
  );

  res.status(httpStatus.OK).json({
    success: true,

    data: milestone,
  });
};

// Current User

const getMyMilestones = async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const milestones = await MilestoneService.getMyMilestones(user.id);

  res.status(httpStatus.OK).json({
    success: true,

    data: milestones,
  });
};

// Moderator / Admin

const getUserMilestones = async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const milestones = await MilestoneService.getUserMilestones(
    user.id,
    req.params.userId as string,
  );

  res.status(httpStatus.OK).json({
    success: true,

    data: milestones,
  });
};

// Admin

const createMilestone = async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const input = CreateMilestoneSchema.parse(req.body);

  const milestone = await MilestoneService.createMilestone(user.id, input);

  res.status(httpStatus.CREATED).json({
    success: true,

    message: "Milestone created successfully",

    data: milestone,
  });
};

const updateMilestone = async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const input = UpdateMilestoneSchema.parse(req.body);

  const milestone = await MilestoneService.updateMilestone(
    user.id,
    req.params.milestoneId as string,
    input,
  );

  res.status(httpStatus.OK).json({
    success: true,

    message: "Milestone updated successfully",

    data: milestone,
  });
};

const deleteMilestone = async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await MilestoneService.deleteMilestone(
    user.id,
    req.params.milestoneId as string,
  );

  res.status(httpStatus.OK).json({
    success: true,

    message: "Milestone deleted successfully",
  });
};

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
