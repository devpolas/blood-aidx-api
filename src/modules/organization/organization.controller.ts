import type { Request, Response } from "express";

import httpStatus from "http-status";

import {
  AddOrganizationMemberSchema,
  CreateOrganizationSchema,
  UpdateOrganizationMemberSchema,
  UpdateOrganizationSchema,
  UpdateOrganizationStatusSchema,
} from "./organization.schema";

import { OrganizationService } from "./organization.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const getMyOrganizations = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await OrganizationService.getMyOrganizations(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organizations retrieved successfully",
    data: result,
  });
});

const getOrganizations = catchAsync(async (_req: Request, res: Response) => {
  const result = await OrganizationService.getOrganizations();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organizations retrieved successfully",
    data: result,
  });
});

const getOrganization = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.getOrganization(
    req.params.organizationId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization retrieved successfully",
    data: result,
  });
});

const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = CreateOrganizationSchema.parse(req.body);

  const result = await OrganizationService.createOrganization(user.id, data);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Organization created successfully",
    data: result,
  });
});

const updateOrganization = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = UpdateOrganizationSchema.parse(req.body);

  const result = await OrganizationService.updateOrganization(
    req.params.organizationId as string,
    user.id,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization updated successfully",
    data: result,
  });
});

const updateOrganizationStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const data = UpdateOrganizationStatusSchema.parse(req.body);

    const result = await OrganizationService.updateOrganizationStatus(
      req.params.organizationId as string,
      user.id,
      data,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization status updated successfully",
      data: result,
    });
  },
);

const deleteOrganization = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await OrganizationService.deleteOrganization(
    req.params.organizationId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization deleted successfully",
  });
});

const addMember = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = AddOrganizationMemberSchema.parse(req.body);

  const result = await OrganizationService.addMember(
    req.params.organizationId as string,
    user.id,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Organization member added successfully",
    data: result,
  });
});

const getMembers = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await OrganizationService.getMembers(
    req.params.organizationId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization members retrieved successfully",
    data: result,
  });
});

const updateMember = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const data = UpdateOrganizationMemberSchema.parse(req.body);

  const result = await OrganizationService.updateMember(
    req.params.organizationId as string,
    req.params.memberUserId as string,
    user.id,
    data,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization member updated successfully",
    data: result,
  });
});

const removeMember = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await OrganizationService.removeMember(
    req.params.organizationId as string,
    req.params.memberUserId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization member removed successfully",
  });
});

export const OrganizationController = {
  getMyOrganizations,
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
  addMember,
  getMembers,
  updateMember,
  removeMember,
};
