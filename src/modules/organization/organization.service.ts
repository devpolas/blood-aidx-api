import httpStatus from "http-status";

import type {
  AddOrganizationMemberInput,
  CreateOrganizationInput,
  OrganizationQueryInput,
  UpdateOrganizationInput,
  UpdateOrganizationMemberInput,
  UpdateOrganizationStatusInput,
} from "./organization.schema";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

// Types

type GlobalRole = "user" | "moderator" | "admin";
type OrganizationMemberRole = "admin" | "staff" | "verifier";

const PUBLIC_ORGANIZATION_STATUSES = ["active", "verified"] as const;

// User

const getUserById = async (userId: string) => {
  const user = await db.orm.public.User.where({
    id: userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

// Location

const getLocationData = (location: CreateOrganizationInput["location"]) => ({
  country: location.country,
  division: location.division,
  city: location.city,
  village: location.village,
  postalCode: location.postalCode,
  ...(location.addressLine !== undefined && {
    addressLine: location.addressLine,
  }),
  ...(location.latitude !== undefined && {
    latitude: location.latitude,
  }),
  ...(location.longitude !== undefined && {
    longitude: location.longitude,
  }),
});

// Organization

const getOrganizationById = async (organizationId: string) => {
  const organization = await db.orm.public.Organization.where({
    id: organizationId,
  }).first();

  if (!organization) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  return organization;
};

// Membership

const getMembership = async (organizationId: string, userId: string) => {
  return db.orm.public.OrganizationMember.where({
    organizationId,
    userId,
  }).first();
};

// Global Authorization

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

// Organization Access

const getOrganizationAccess = async (
  organizationId: string,
  userId: string,
) => {
  const [organization, user, membership] = await Promise.all([
    getOrganizationById(organizationId),
    getUserById(userId),
    getMembership(organizationId, userId),
  ]);

  const isOwner = organization.ownerId === userId;
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

// Organization List

// Organization List

const applyOrganizationFilters = (query: OrganizationQueryInput) => {
  const requestedStatus = query.status;

  const isPublicStatus =
    requestedStatus !== undefined &&
    (PUBLIC_ORGANIZATION_STATUSES as readonly string[]).includes(
      requestedStatus,
    );

  return {
    status: isPublicStatus ? requestedStatus : undefined,
    locationId:
      query.locationId && !query.country && !query.division && !query.city
        ? query.locationId
        : undefined,
  };
};

const getEmptyOrganizationList = (query: OrganizationQueryInput) => ({
  data: [],
  meta: {
    page: query.page,
    limit: query.limit,
    total: 0,
    totalPage: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});

const getOrganizationList = async (query: OrganizationQueryInput) => {
  const filters = applyOrganizationFilters(query);

  const hasLocationFilters = Boolean(
    query.country || query.division || query.city,
  );

  let locationIds: string[] | undefined;

  if (hasLocationFilters) {
    const locations = await db.orm.public.Location.where({
      ...(query.country && { country: query.country }),
      ...(query.division && { division: query.division }),
      ...(query.city && { city: query.city }),
    })
      .select("id")
      .all();

    locationIds = locations.map((location) => location.id);

    if (locationIds.length === 0) {
      return getEmptyOrganizationList(query);
    }

    if (query.locationId) {
      if (!locationIds.includes(query.locationId)) {
        return getEmptyOrganizationList(query);
      }

      locationIds = [query.locationId];
    }
  }

  const offset = (query.page - 1) * query.limit;
  const ascending = query.sortOrder === "asc";

  const hasRequestedStatus = filters.status !== undefined;

  let filteredQuery = hasRequestedStatus
    ? db.orm.public.Organization.where({
        status: filters.status,
      })
    : db.orm.public.Organization.where((organization) =>
        organization.status.in([...PUBLIC_ORGANIZATION_STATUSES]),
      );

  if (filters.locationId) {
    filteredQuery = filteredQuery.where({
      locationId: filters.locationId,
    });
  }

  if (locationIds !== undefined) {
    filteredQuery = filteredQuery.where((organization) =>
      organization.locationId.in(locationIds),
    );
  }

  const types = query.types;

  if (types?.length) {
    filteredQuery = filteredQuery.where((organization) =>
      organization.type.in(types),
    );
  }

  const search = query.search;

  if (search) {
    filteredQuery = filteredQuery.where((organization) =>
      organization.name.ilike(`%${search}%`),
    );
  }

  const createdAtFrom = query.createdAtFrom;

  if (createdAtFrom) {
    filteredQuery = filteredQuery.where((organization) =>
      organization.createdAt.gte(createdAtFrom),
    );
  }

  const createdAtTo = query.createdAtTo;

  if (createdAtTo) {
    filteredQuery = filteredQuery.where((organization) =>
      organization.createdAt.lte(createdAtTo),
    );
  }

  const getSortedOrganizations = () => {
    switch (query.sortBy) {
      case "updatedAt":
        return filteredQuery
          .orderBy((organization) =>
            ascending
              ? organization.updatedAt.asc()
              : organization.updatedAt.desc(),
          )
          .offset(offset)
          .limit(query.limit)
          .all();

      case "name":
        return filteredQuery
          .orderBy((organization) =>
            ascending ? organization.name.asc() : organization.name.desc(),
          )
          .offset(offset)
          .limit(query.limit)
          .all();

      case "type":
        return filteredQuery
          .orderBy((organization) =>
            ascending ? organization.type.asc() : organization.type.desc(),
          )
          .offset(offset)
          .limit(query.limit)
          .all();

      case "status":
        return filteredQuery
          .orderBy((organization) =>
            ascending ? organization.status.asc() : organization.status.desc(),
          )
          .offset(offset)
          .limit(query.limit)
          .all();

      case "createdAt":
      default:
        return filteredQuery
          .orderBy((organization) =>
            ascending
              ? organization.createdAt.asc()
              : organization.createdAt.desc(),
          )
          .offset(offset)
          .limit(query.limit)
          .all();
    }
  };

  const [data, totalResult] = await Promise.all([
    getSortedOrganizations(),
    filteredQuery.aggregate((aggregate) => ({
      total: aggregate.count(),
    })),
  ]);

  const total = totalResult.total;
  const totalPage = Math.ceil(total / query.limit);

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPage,
      hasNextPage: query.page < totalPage,
      hasPreviousPage: query.page > 1 && totalPage > 0,
    },
  };
};

// Public Organization

const getOrganizations = async (query: OrganizationQueryInput) => {
  return getOrganizationList(query);
};

const getOrganization = async (organizationId: string) => {
  const organization = await getOrganizationById(organizationId);

  if (
    !PUBLIC_ORGANIZATION_STATUSES.includes(
      organization.status as (typeof PUBLIC_ORGANIZATION_STATUSES)[number],
    )
  ) {
    throw new AppError("Organization not found", httpStatus.NOT_FOUND);
  }

  return organization;
};

// My Organizations

const getMyOrganizations = async (userId: string) => {
  await getUserById(userId);

  const [ownedOrganizations, memberships] = await Promise.all([
    db.orm.public.Organization.where({
      ownerId: userId,
    }).all(),

    db.orm.public.OrganizationMember.where({
      userId,
    }).all(),
  ]);

  if (!memberships.length) {
    return ownedOrganizations;
  }

  const memberOrganizations = await Promise.all(
    memberships.map((membership) =>
      db.orm.public.Organization.where({
        id: membership.organizationId,
      }).first(),
    ),
  );

  const organizations = new Map(
    [
      ...ownedOrganizations,
      ...memberOrganizations.filter(
        (organization): organization is NonNullable<typeof organization> =>
          organization !== null,
      ),
    ].map((organization) => [organization.id, organization]),
  );

  return [...organizations.values()];
};

// Organization By User Access

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

// Create Organization

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

  return db.transaction(async (tx) => {
    const location = await tx.orm.public.Location.create(
      getLocationData(data.location),
    );

    return tx.orm.public.Organization.create({
      ownerId: userId,
      locationId: location.id,
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
      ...(data.registrationNo !== undefined && {
        registrationNo: data.registrationNo,
      }),
    });
  });
};

// Update Organization

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

  return db.transaction(async (tx) => {
    let locationId = organization.locationId;

    if (data.location) {
      const locationPayload = getLocationData(data.location);

      if (locationId) {
        await tx.orm.public.Location.where({
          id: locationId,
        }).update(locationPayload);
      } else {
        const location = await tx.orm.public.Location.create(locationPayload);

        locationId = location.id;
      }
    }

    return tx.orm.public.Organization.where({
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
      ...(data.location !== undefined && {
        locationId,
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
      ...(data.registrationNo !== undefined && {
        registrationNo: data.registrationNo,
      }),
    });
  });
};

// Update Organization Status

const updateOrganizationStatus = async (
  organizationId: string,
  userId: string,
  data: UpdateOrganizationStatusInput,
) => {
  const verifier = await requireGlobalModerator(userId);
  const organization = await getOrganizationById(organizationId);

  if (data.status === organization.status) {
    return organization;
  }

  if (data.status === "verified" && organization.status === "rejected") {
    throw new AppError(
      "Rejected organizations cannot be directly verified",
      httpStatus.BAD_REQUEST,
    );
  }

  if (
    data.status === "suspended" &&
    organization.status !== "active" &&
    organization.status !== "verified"
  ) {
    throw new AppError(
      "Only active or verified organizations can be suspended",
      httpStatus.BAD_REQUEST,
    );
  }

  if (data.status === "verified") {
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
    status: data.status,
    verifiedById: null,
    verifiedAt: null,
  });
};

// Delete Organization

const deleteOrganization = async (organizationId: string, userId: string) => {
  const { organization } = await getOrganizationAccess(organizationId, userId);

  if (organization.ownerId !== userId) {
    throw new AppError(
      "Only the organization owner can delete this organization",
      httpStatus.FORBIDDEN,
    );
  }

  if (organization.status === "active" || organization.status === "verified") {
    throw new AppError(
      "Active or verified organizations cannot be deleted",
      httpStatus.BAD_REQUEST,
    );
  }

  await db.orm.public.Organization.where({
    id: organizationId,
  }).delete();

  return null;
};

// Members

const addMember = async (
  organizationId: string,
  userId: string,
  data: AddOrganizationMemberInput,
) => {
  const { organization } = await requireOrganizationManager(
    organizationId,
    userId,
  );

  if (data.userId === organization.ownerId) {
    throw new AppError(
      "The organization owner does not need to be added as a member",
      httpStatus.BAD_REQUEST,
    );
  }

  await getUserById(data.userId);

  const existingMember = await getMembership(organizationId, data.userId);

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

  await db.orm.public.OrganizationMember.where({
    organizationId,
    userId: memberUserId,
  }).delete();

  return null;
};

export const OrganizationService = {
  getOrganizations,
  getOrganization,
  getMyOrganizations,
  getOrganizationByIdForUser,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
  addMember,
  getMembers,
  updateMember,
  removeMember,
};
