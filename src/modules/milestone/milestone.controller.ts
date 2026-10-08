import type { Request, Response } from "express";

import httpStatus from "http-status";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import {
  CreateMilestoneSchema,
  MilestoneQuerySchema,
  UpdateMilestoneSchema,
  UserMilestoneQuerySchema,
} from "./milestone.schema";
import { MilestoneService } from "./milestone.service";

export const MilestoneController = {
  // Public

  getMilestones: catchAsync(async (req: Request, res: Response) => {
    const query = MilestoneQuerySchema.parse(req.query);
    const result = await MilestoneService.getMilestones(query);

    sendResponse(res, {
      success: true,
      message: "Milestones retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        milestones: result.data,
      },
      meta: result.meta,
    });
  }),

  getMilestoneById: catchAsync(async (req: Request, res: Response) => {
    const milestone = await MilestoneService.getMilestone(
      req.params.milestoneId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Milestone retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        milestone,
      },
    });
  }),

  // Current User

  getMyMilestones: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);
    const query = UserMilestoneQuerySchema.parse(req.query);

    const result = await MilestoneService.getMyMilestones(user.id, query);

    sendResponse(res, {
      success: true,
      message: "Your milestones retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        milestones: result.data,
      },
      meta: result.meta,
    });
  }),

  // Moderator / Admin

  getUserMilestones: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);
    const query = UserMilestoneQuerySchema.parse(req.query);

    const result = await MilestoneService.getUserMilestones(
      user.id,
      req.params.userId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      message: "User milestones retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        milestones: result.data,
      },
      meta: result.meta,
    });
  }),

  // Admin

  createMilestone: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);
    const data = CreateMilestoneSchema.parse(req.body);

    const milestone = await MilestoneService.createMilestone(user.id, data);

    sendResponse(res, {
      success: true,
      message: "Milestone created successfully",
      statusCode: httpStatus.CREATED,
      data: {
        milestone,
      },
    });
  }),

  updateMilestone: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);
    const data = UpdateMilestoneSchema.parse(req.body);

    const milestone = await MilestoneService.updateMilestone(
      user.id,
      req.params.milestoneId as string,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Milestone updated successfully",
      statusCode: httpStatus.OK,
      data: {
        milestone,
      },
    });
  }),

  deleteMilestone: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await MilestoneService.deleteMilestone(
      user.id,
      req.params.milestoneId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Milestone deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
