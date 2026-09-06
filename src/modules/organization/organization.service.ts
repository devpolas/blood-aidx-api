import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  AddOrganizationMemberInput,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  UpdateOrganizationMemberInput,
} from "./organization.schema";

const getOrganizationById = async (organizationId: string) => {
  const organization = await db.orm.public.Organization.where({
    id: organizationId,
  }).first();

  if (!organization) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  return organization;
};

const getMyOrganizations = async (userId: string) => {
  return db.orm.public.Organization.where({
    ownerId: userId,
  }).all();
};

const getOrganizationByIdForUser = async (
  organizationId: string,
  userId: string,
) => {
  const organization = await getOrganizationById(organizationId);

  const isOwner = organization.ownerId === userId;

  const member = await db.orm.public.OrganizationMember.where({
    organizationId,
    userId,
  }).first();

  if (!isOwner && !member) {
    throw new AppError(
      "You do not have access to this organization",
      httpStatus.FORBIDDEN,
    );
  }

  return organization;
};

const createOrganization = async (
  userId: string,
  data: CreateOrganizationInput,
) => {
  const existingSlug = await db.orm.public.Organization.where({
    slug: data.slug,
  }).first();

  if (existingSlug) {
    throw new AppError("Organization slug already exists", httpStatus.CONFLICT);
  }

  return db.orm.public.Organization.create({
    ownerId: userId,

    ...(data.locationId !== undefined && {
      locationId: data.locationId,
    }),

    name: data.name,
    slug: data.slug,
    type: data.type,

    status: "pending",

    ...(data.description !== undefined && {
      description: data.description,
    }),

    ...(data.phone !== undefined && {
      phone: data.phone,
    }),

    ...(data.email !== undefined && {
      email: data.email,
    }),

    ...(data.website !== undefined && {
      website: data.website,
    }),
  });
};

const updateOrganization = async (
  organizationId: string,
  userId: string,
  data: UpdateOrganizationInput,
) => {
  const organization = await getOrganizationById(organizationId);

  if (organization.ownerId !== userId) {
    throw new AppError(
      "Only the organization owner can update this organization",
      httpStatus.FORBIDDEN,
    );
  }

  if (data.slug !== undefined && data.slug !== organization.slug) {
    const existingSlug = await db.orm.public.Organization.where({
      slug: data.slug,
    }).first();

    if (existingSlug && existingSlug.id !== organizationId) {
      throw new AppError(
        "Organization slug already exists",
        httpStatus.CONFLICT,
      );
    }
  }

  const updateData = {
    ...(data.name !== undefined && {
      name: data.name,
    }),

    ...(data.slug !== undefined && {
      slug: data.slug,
    }),

    ...(data.type !== undefined && {
      type: data.type,
    }),

    ...(data.locationId !== undefined && {
      locationId: data.locationId,
    }),

    ...(data.description !== undefined && {
      description: data.description,
    }),

    ...(data.phone !== undefined && {
      phone: data.phone,
    }),

    ...(data.email !== undefined && {
      email: data.email,
    }),

    ...(data.website !== undefined && {
      website: data.website,
    }),
  };

  return db.orm.public.Organization.where({ id: organizationId }).update(
    updateData,
  );
};

const getOrganizations = async () => {
  return db.orm.public.Organization.where({
    status: "verified",
  }).all();
};

const getOrganization = async (organizationId: string) => {
  return getOrganizationById(organizationId);
};

const verifyOrganization = async (
  organizationId: string,
  verifierId: string,
) => {
  const organization = await getOrganizationById(organizationId);

  if (organization.status === "verified") {
    return organization;
  }

  if (organization.status === "rejected") {
    throw new AppError(
      "Rejected organizations cannot be directly verified",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.orm.public.Organization.where({ id: organizationId }).update({
    status: "verified",
    verifiedById: verifierId,
    verifiedAt: new Date().toISOString(),
  });
};

const updateOrganizationStatus = async (
  organizationId: string,
  status: "pending" | "active" | "verified" | "suspended" | "rejected",
  verifierId: string,
) => {
  const organization = await getOrganizationById(organizationId);

  if (status === "verified") {
    return verifyOrganization(organizationId, verifierId);
  }

  if (
    status === "suspended" &&
    organization.status !== "verified" &&
    organization.status !== "active"
  ) {
    throw new AppError(
      "Only active or verified organizations can be suspended",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.orm.public.Organization.where({ id: organizationId }).update({
    status,
  });
};

const deleteOrganization = async (organizationId: string, userId: string) => {
  const organization = await getOrganizationById(organizationId);

  if (organization.ownerId !== userId) {
    throw new AppError(
      "Only the organization owner can delete this organization",
      httpStatus.FORBIDDEN,
    );
  }

  if (organization.status === "verified" || organization.status === "active") {
    throw new AppError(
      "Active or verified organizations cannot be deleted",
      httpStatus.BAD_REQUEST,
    );
  }

  return db.orm.public.Organization.where({ id: organizationId }).delete();
};

const addMember = async (
  organizationId: string,
  ownerId: string,
  data: AddOrganizationMemberInput,
) => {
  const organization = await getOrganizationById(organizationId);

  if (organization.ownerId !== ownerId) {
    throw new AppError(
      "Only the organization owner can manage members",
      httpStatus.FORBIDDEN,
    );
  }

  if (data.userId === ownerId) {
    throw new AppError(
      "The organization owner does not need to be added as a member",
      httpStatus.BAD_REQUEST,
    );
  }

  const user = await db.orm.public.User.where({
    id: data.userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  const existingMember = await db.orm.public.OrganizationMember.where({
    organizationId,
    userId: data.userId,
  }).first();

  if (existingMember) {
    throw new AppError(
      "User is already a member of this organization",
      httpStatus.CONFLICT,
    );
  }

  return db.orm.public.OrganizationMember.create({
    organizationId,
    userId: data.userId,
    role: data.role,
  });
};

const getMembers = async (organizationId: string, userId: string) => {
  await getOrganizationByIdForUser(organizationId, userId);

  return db.orm.public.OrganizationMember.where({
    organizationId,
  }).all();
};

const updateMember = async (
  organizationId: string,
  memberUserId: string,
  ownerId: string,
  data: UpdateOrganizationMemberInput,
) => {
  const organization = await getOrganizationById(organizationId);

  if (organization.ownerId !== ownerId) {
    throw new AppError(
      "Only the organization owner can manage members",
      httpStatus.FORBIDDEN,
    );
  }

  if (memberUserId === ownerId) {
    throw new AppError(
      "The organization owner is managed through ownerId",
      httpStatus.BAD_REQUEST,
    );
  }

  const member = await db.orm.public.OrganizationMember.where({
    organizationId,
    userId: memberUserId,
  }).first();

  if (!member) {
    throw new AppError("Organization member not found", httpStatus.NOT_FOUND);
  }

  return db.orm.public.OrganizationMember.where({
    organizationId,
    userId: memberUserId,
  }).update({
    role: data.role,
  });
};

const removeMember = async (
  organizationId: string,
  memberUserId: string,
  ownerId: string,
) => {
  const organization = await getOrganizationById(organizationId);

  if (organization.ownerId !== ownerId) {
    throw new AppError(
      "Only the organization owner can manage members",
      httpStatus.FORBIDDEN,
    );
  }

  if (memberUserId === ownerId) {
    throw new AppError(
      "The organization owner cannot be removed",
      httpStatus.BAD_REQUEST,
    );
  }

  const member = await db.orm.public.OrganizationMember.where({
    organizationId,
    userId: memberUserId,
  }).first();

  if (!member) {
    throw new AppError("Organization member not found", httpStatus.NOT_FOUND);
  }

  return db.orm.public.OrganizationMember.where({
    organizationId,
    userId: memberUserId,
  }).delete();
};

export const OrganizationService = {
  getMyOrganizations,
  getOrganization,
  getOrganizationByIdForUser,
  getOrganizations,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  verifyOrganization,
  deleteOrganization,
  addMember,
  getMembers,
  updateMember,
  removeMember,
};
