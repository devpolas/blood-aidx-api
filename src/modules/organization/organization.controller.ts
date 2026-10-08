import type { Request, Response } from "express";

import httpStatus from "http-status";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import {
  AddOrganizationMemberSchema,
  CreateOrganizationSchema,
  OrganizationQuerySchema,
  UpdateOrganizationMemberSchema,
  UpdateOrganizationSchema,
  UpdateOrganizationStatusSchema,
} from "./organization.schema";
import { OrganizationService } from "./organization.service";

export const OrganizationController = {
  // Public

  getOrganizations: catchAsync(async (req: Request, res: Response) => {
    const query = OrganizationQuerySchema.parse(req.query);
    const result = await OrganizationService.getOrganizations(query);

    sendResponse(res, {
      success: true,
      message: "Organizations retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        organizations: result.data,
      },
      meta: result.meta,
    });
  }),

  getOrganization: catchAsync(async (req: Request, res: Response) => {
    const organization = await OrganizationService.getOrganization(
      req.params.organizationId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Organization retrieved successfully",
      statusCode: httpStatus.OK,
      data: { organization },
    });
  }),

  // Current User

  getMyOrganizations: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const organizations = await OrganizationService.getMyOrganizations(user.id);

    sendResponse(res, {
      success: true,
      message: "Organizations retrieved successfully",
      statusCode: httpStatus.OK,
      data: { organizations },
    });
  }),

  // Organization

  createOrganization: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);
    const data = CreateOrganizationSchema.parse(req.body);

    const organization = await OrganizationService.createOrganization(
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Organization created successfully",
      statusCode: httpStatus.CREATED,
      data: { organization },
    });
  }),

  updateOrganization: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);
    const data = UpdateOrganizationSchema.parse(req.body);

    const organization = await OrganizationService.updateOrganization(
      req.params.organizationId as string,
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Organization updated successfully",
      statusCode: httpStatus.OK,
      data: { organization },
    });
  }),

  deleteOrganization: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await OrganizationService.deleteOrganization(
      req.params.organizationId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Organization deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  // Organization Status

  updateOrganizationStatus: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);
    const data = UpdateOrganizationStatusSchema.parse(req.body);

    const organization = await OrganizationService.updateOrganizationStatus(
      req.params.organizationId as string,
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Organization status updated successfully",
      statusCode: httpStatus.OK,
      data: { organization },
    });
  }),

  // Members

  getMembers: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const organizationMembers = await OrganizationService.getMembers(
      req.params.organizationId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Organization members retrieved successfully",
      statusCode: httpStatus.OK,
      data: { organizationMembers },
    });
  }),

  addMember: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);
    const data = AddOrganizationMemberSchema.parse(req.body);

    const organizationMember = await OrganizationService.addMember(
      req.params.organizationId as string,
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Organization member added successfully",
      statusCode: httpStatus.CREATED,
      data: { organizationMember },
    });
  }),

  updateMember: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);
    const data = UpdateOrganizationMemberSchema.parse(req.body);

    const organizationMember = await OrganizationService.updateMember(
      req.params.organizationId as string,
      req.params.memberUserId as string,
      user.id,
      data,
    );

    sendResponse(res, {
      success: true,
      message: "Organization member updated successfully",
      statusCode: httpStatus.OK,
      data: { organizationMember },
    });
  }),

  removeMember: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await OrganizationService.removeMember(
      req.params.organizationId as string,
      req.params.memberUserId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Organization member removed successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),
};
