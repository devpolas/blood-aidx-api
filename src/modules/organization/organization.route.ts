import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

import { OrganizationController } from "./organization.controller";

const router: ExpressRouter = Router();

// Public

// Verified organizations
router.get("/", OrganizationController.getOrganizations);

// Verified organization details
router.get("/:organizationId", OrganizationController.getOrganization);

// Authenticated

router.use(protect, requireActiveUser);

// My Organizations

router.get(
  "/my",
  requireVerifiedEmail,
  OrganizationController.getMyOrganizations,
);

// Create Organization

router.post(
  "/",
  requireVerifiedEmail,
  OrganizationController.createOrganization,
);

// Organization Management

router.patch(
  "/:organizationId",
  requireVerifiedEmail,
  OrganizationController.updateOrganization,
);

router.delete(
  "/:organizationId",
  requireVerifiedEmail,
  OrganizationController.deleteOrganization,
);

// Organization Status
// Moderator / Admin authorization is handled
// inside OrganizationService

router.patch(
  "/:organizationId/status",
  requireVerifiedEmail,
  OrganizationController.updateOrganizationStatus,
);

// Members

router.get(
  "/:organizationId/members",
  requireVerifiedEmail,
  OrganizationController.getMembers,
);

router.post(
  "/:organizationId/members",
  requireVerifiedEmail,
  OrganizationController.addMember,
);

router.patch(
  "/:organizationId/members/:memberUserId",
  requireVerifiedEmail,
  OrganizationController.updateMember,
);

router.delete(
  "/:organizationId/members/:memberUserId",
  requireVerifiedEmail,
  OrganizationController.removeMember,
);

export default router;
