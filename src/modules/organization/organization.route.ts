import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

import { OrganizationController } from "./organization.controller";

const router: ExpressRouter = Router();

// Public
router.get("/", OrganizationController.getOrganizations);

router.get("/:organizationId", OrganizationController.getOrganization);

// My Organizations
router.get(
  "/my",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.getMyOrganizations,
);

// Create Organization
router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.createOrganization,
);

// Organization Status
// Moderator / Admin authorization is handled
// inside OrganizationService
router.patch(
  "/:organizationId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.updateOrganizationStatus,
);

// Members
router.get(
  "/:organizationId/members",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.getMembers,
);

router.post(
  "/:organizationId/members",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.addMember,
);

router.patch(
  "/:organizationId/members/:memberUserId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.updateMember,
);

router.delete(
  "/:organizationId/members/:memberUserId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.removeMember,
);

// Organization Management
router.patch(
  "/:organizationId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.updateOrganization,
);

router.delete(
  "/:organizationId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.deleteOrganization,
);

export default router;
