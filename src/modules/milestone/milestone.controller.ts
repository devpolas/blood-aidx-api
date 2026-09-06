import type { Request, Response } from "express";
import {
  CreateMilestoneSchema,
  UpdateMilestoneSchema,
} from "./milestone.schema";

import { MilestoneService } from "./milestone.service";
import { requireAuth } from "../../middleware/auth.middleware";

// Admin

const createMilestone = async (req: Request, res: Response) => {
  const input = CreateMilestoneSchema.parse(req.body);

  const milestone = await MilestoneService.createMilestone(input);

  res.status(201).json({
    success: true,
    message: "Milestone created successfully",
    data: milestone,
  });
};

const getMilestones = async (_req: Request, res: Response) => {
  const milestones = await MilestoneService.getMilestones();

  res.status(200).json({
    success: true,
    data: milestones,
  });
};

const getMilestoneById = async (req: Request, res: Response) => {
  const milestone = await MilestoneService.getMilestoneById(
    req.params.milestoneId as string,
  );

  res.status(200).json({
    success: true,
    data: milestone,
  });
};

const updateMilestone = async (req: Request, res: Response) => {
  const input = UpdateMilestoneSchema.parse(req.body);

  const milestone = await MilestoneService.updateMilestone(
    req.params.milestoneId as string,
    input,
  );

  res.status(200).json({
    success: true,
    message: "Milestone updated successfully",
    data: milestone,
  });
};

const deleteMilestone = async (req: Request, res: Response) => {
  await MilestoneService.deleteMilestone(req.params.milestoneId as string);

  res.status(200).json({
    success: true,
    message: "Milestone deleted successfully",
  });
};

// Current User

const getMyMilestones = async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const milestones = await MilestoneService.getMyMilestones(user.id);

  res.status(200).json({
    success: true,
    data: milestones,
  });
};

const getUserMilestones = async (req: Request, res: Response) => {
  const milestones = await MilestoneService.getUserMilestones(
    req.params.userId as string,
  );

  res.status(200).json({
    success: true,
    data: milestones,
  });
};

export const MilestoneController = {
  createMilestone,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
  getMyMilestones,
  getUserMilestones,
};
