import { Router, type Router as ExpressRouter } from "express";

import { OrganizationController } from "./organization.controller";
import {
  protect,
  requireActiveUser,
  requireRole,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

const requireOrganizationVerifier = requireRole(
  "hospital",
  "blood_bank",
  "moderator",
  "admin",
);

// Public verified organizations
router.get("/", OrganizationController.getOrganizations);

// Authenticated user's organizations
router.get(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.getMyOrganizations,
);

// Create organization
router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  OrganizationController.createOrganization,
);

// Organization details
router.get("/:organizationId", OrganizationController.getOrganization);

// Owner management
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

// Organization verification/status
router.patch(
  "/:organizationId/status",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireOrganizationVerifier,
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

export default router;
