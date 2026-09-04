import { Router, type Router as ExpressRouter } from "express";

import { LocationController } from "./location.controller";

import {
  protect,
  requireActiveUser,
  requireModerator,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Protected + Active + Verified Routes

// Get My Location
router.get(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  LocationController.getMyLocation,
);

// Create My Location
router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  LocationController.createLocation,
);

// Update My Location
router.patch(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  LocationController.updateLocation,
);

// Delete My Location
router.delete(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  LocationController.deleteMyLocation,
);

// Public Routes

// Get Location By ID
router.get("/:locationId", LocationController.getLocationById);

// Moderator / Admin Routes

// Delete Location By ID
router.delete(
  "/:locationId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireModerator,
  LocationController.deleteLocationById,
);

export default router;
