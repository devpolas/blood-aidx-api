import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type {
  AddOrganizationMemberInput,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  UpdateOrganizationMemberInput,
  UpdateOrganizationStatusInput,
} from "./organization.schema";

type GlobalRole =
  | "donor"
  | "recipient"
  | "volunteer"
  | "hospital"
  | "blood_bank"
  | "moderator"
  | "admin";

type OrganizationMemberRole = "admin" | "staff" | "verifier";

const getUserById = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

const getOrganizationById = async (organizationId: string) => {
  const organization = await db.orm.public.Organization.where({
    id: organizationId,
  }).first();

  if (!organization) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  return organization;
};

const getMembership = async (organizationId: string, userId: string) => {
  return db.orm.public.OrganizationMember.where({
    organizationId,
    userId,
  }).first();
};

const isGlobalModerator = (role: GlobalRole) =>
  role === "moderator" || role === "admin";

const requireGlobalModerator = async (userId: string) => {
  const user = await getUserById(userId);

  if (!isGlobalModerator(user.role as GlobalRole)) {
    throw new AppError(
      "Moderator or admin access required",
      httpStatus.FORBIDDEN,
    );
  }

  return user;
};

const getOrganizationAccess = async (
  organizationId: string,
  userId: string,
) => {
  const organization = await getOrganizationById(organizationId);
  const user = await getUserById(userId);
  const isOwner = organization.ownerId === userId;
  const membership = await getMembership(organizationId, userId);
  const isModerator = isGlobalModerator(user.role as GlobalRole);

  return {
    organization,
    user,
    membership,
    isOwner,
    isModerator,
    memberRole: membership?.role as OrganizationMemberRole | undefined,
  };
};

const requireOrganizationAccess = async (
  organizationId: string,
  userId: string,
) => {
  const access = await getOrganizationAccess(organizationId, userId);

  if (!access.isOwner && !access.membership && !access.isModerator) {
    throw new AppError(
      "You do not have access to this organization",
      httpStatus.FORBIDDEN,
    );
  }

  return access;
};

const requireOrganizationManager = async (
  organizationId: string,
  userId: string,
) => {
  const access = await getOrganizationAccess(organizationId, userId);

  const isOrganizationAdmin = access.isOwner || access.memberRole === "admin";

  if (!isOrganizationAdmin && !access.isModerator) {
    throw new AppError(
      "Organization admin access required",
      httpStatus.FORBIDDEN,
    );
  }

  return access;
};

// Organization

const getMyOrganizations = async (userId: string) => {
  await getUserById(userId);

  return db.orm.public.Organization.where({
    ownerId: userId,
  }).all();
};

const getOrganizations = async () => {
  return db.orm.public.Organization.where({
    status: "verified",
  }).all();
};

const getOrganization = async (organizationId: string) => {
  const organization = await getOrganizationById(organizationId);

  if (organization.status !== "verified") {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  return organization;
};

const getOrganizationByIdForUser = async (
  organizationId: string,
  userId: string,
) => {
  const { organization } = await requireOrganizationAccess(
    organizationId,
    userId,
  );

  return organization;
};

const createOrganization = async (
  userId: string,
  data: CreateOrganizationInput,
) => {
  await getUserById(userId);

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
  const { organization } = await requireOrganizationManager(
    organizationId,
    userId,
  );

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

  return db.orm.public.Organization.where({
    id: organizationId,
  }).update({
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
  });
};

const updateOrganizationStatus = async (
  organizationId: string,
  userId: string,
  data: UpdateOrganizationStatusInput,
) => {
  const verifier = await requireGlobalModerator(userId);

  const organization = await getOrganizationById(organizationId);

  const { status } = data;

  if (status === "verified" && organization.status === "rejected") {
    throw new AppError(
      "Rejected organizations cannot be directly verified",
      httpStatus.BAD_REQUEST,
    );
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

  if (status === "verified") {
    return db.orm.public.Organization.where({
      id: organizationId,
    }).update({
      status: "verified",
      verifiedById: verifier.id,
      verifiedAt: new Date().toISOString(),
    });
  }

  return db.orm.public.Organization.where({
    id: organizationId,
  }).update({
    status,
  });
};

const deleteOrganization = async (organizationId: string, userId: string) => {
  const { organization } = await getOrganizationAccess(organizationId, userId);

  if (!accessIsOwner(organization.ownerId, userId)) {
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

  return db.orm.public.Organization.where({
    id: organizationId,
  }).delete();
};

const accessIsOwner = (ownerId: string, userId: string) => ownerId === userId;

// Members

const addMember = async (
  organizationId: string,
  userId: string,
  data: AddOrganizationMemberInput,
) => {
  await requireOrganizationManager(organizationId, userId);

  const organization = await getOrganizationById(organizationId);

  if (data.userId === organization.ownerId) {
    throw new AppError(
      "The organization owner does not need to be added as a member",
      httpStatus.BAD_REQUEST,
    );
  }

  const memberUser = await getUserById(data.userId);

  const existingMember = await getMembership(organizationId, memberUser.id);

  if (existingMember) {
    throw new AppError(
      "User is already a member of this organization",
      httpStatus.CONFLICT,
    );
  }

  return db.orm.public.OrganizationMember.create({
    organizationId,
    userId: memberUser.id,
    role: data.role,
  });
};

const getMembers = async (organizationId: string, userId: string) => {
  await requireOrganizationAccess(organizationId, userId);

  return db.orm.public.OrganizationMember.where({
    organizationId,
  }).all();
};

const updateMember = async (
  organizationId: string,
  memberUserId: string,
  userId: string,
  data: UpdateOrganizationMemberInput,
) => {
  const { organization } = await requireOrganizationManager(
    organizationId,
    userId,
  );

  if (memberUserId === organization.ownerId) {
    throw new AppError(
      "The organization owner is managed through ownerId",
      httpStatus.BAD_REQUEST,
    );
  }

  const member = await getMembership(organizationId, memberUserId);

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
  userId: string,
) => {
  const { organization } = await requireOrganizationManager(
    organizationId,
    userId,
  );

  if (memberUserId === organization.ownerId) {
    throw new AppError(
      "The organization owner cannot be removed",
      httpStatus.BAD_REQUEST,
    );
  }

  const member = await getMembership(organizationId, memberUserId);

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
  deleteOrganization,
  addMember,
  getMembers,
  updateMember,
  removeMember,
};
