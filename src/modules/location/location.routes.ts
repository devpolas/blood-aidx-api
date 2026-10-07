import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

import { LocationController } from "./location.controller";

const router: ExpressRouter = Router();

// My Location
router.get(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  LocationController.getMyLocation,
);

router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  LocationController.createLocation,
);

router.patch(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  LocationController.updateLocation,
);

router.delete(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  LocationController.deleteMyLocation,
);

// Public Location
router.get("/:locationId", LocationController.getLocationById);

// Moderator / Admin
router.delete(
  "/:locationId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  LocationController.deleteLocationById,
);

export default router;
