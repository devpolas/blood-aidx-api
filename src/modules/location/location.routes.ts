import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

import { LocationController } from "./location.controller";

const router: ExpressRouter = Router();

// Protected Routes

router.use(protect, requireActiveUser);

// My Location

router.get("/me", requireVerifiedEmail, LocationController.getMyLocation);
router.post("/", requireVerifiedEmail, LocationController.createLocation);
router.patch("/me", requireVerifiedEmail, LocationController.updateLocation);
router.delete("/me", requireVerifiedEmail, LocationController.deleteMyLocation);

// Public Location

router.get("/:locationId", LocationController.getLocationById);

// Moderator / Admin

router.delete(
  "/:locationId",
  requireVerifiedEmail,
  LocationController.deleteLocationById,
);

export default router;
