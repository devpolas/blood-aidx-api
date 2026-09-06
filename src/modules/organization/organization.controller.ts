import type { NextFunction, Request, Response } from "express";

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

const getMyOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await OrganizationService.getMyOrganizations(user.id);

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getOrganizations = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await OrganizationService.getOrganizations();

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await OrganizationService.getOrganization(
      req.params.organizationId as string,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = CreateOrganizationSchema.parse(req.body);

    const result = await OrganizationService.createOrganization(user.id, data);

    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Organization created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = UpdateOrganizationSchema.parse(req.body);

    const result = await OrganizationService.updateOrganization(
      req.params.organizationId as string,
      user.id,
      data,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Organization updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrganizationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = UpdateOrganizationStatusSchema.parse(req.body);

    const result = await OrganizationService.updateOrganizationStatus(
      req.params.organizationId as string,
      user.id,
      data,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Organization status updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    await OrganizationService.deleteOrganization(
      req.params.organizationId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = requireAuth(req);

    const data = AddOrganizationMemberSchema.parse(req.body);

    const result = await OrganizationService.addMember(
      req.params.organizationId as string,
      user.id,
      data,
    );

    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Organization member added successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = requireAuth(req);

    const result = await OrganizationService.getMembers(
      req.params.organizationId as string,
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

const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const data = UpdateOrganizationMemberSchema.parse(req.body);

    const result = await OrganizationService.updateMember(
      req.params.organizationId as string,
      req.params.memberUserId as string,
      user.id,
      data,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Organization member updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    await OrganizationService.removeMember(
      req.params.organizationId as string,
      req.params.memberUserId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Organization member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

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
