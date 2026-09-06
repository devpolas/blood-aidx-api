import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireAdmin,
} from "../../../middleware/auth.middleware";

import { AdminUserController } from "./admin-user.controller";

const router: ExpressRouter = Router();

// Admin User Management

router.get(
  "/",
  protect,
  requireActiveUser,
  requireAdmin,
  AdminUserController.getUsers,
);

router.get(
  "/:userId",
  protect,
  requireActiveUser,
  requireAdmin,
  AdminUserController.getUser,
);

router.patch(
  "/:userId",
  protect,
  requireActiveUser,
  requireAdmin,
  AdminUserController.updateUser,
);

router.patch(
  "/:userId/role",
  protect,
  requireActiveUser,
  requireAdmin,
  AdminUserController.changeUserRole,
);

router.patch(
  "/:userId/ban",
  protect,
  requireActiveUser,
  requireAdmin,
  AdminUserController.banUser,
);

router.patch(
  "/:userId/unban",
  protect,
  requireActiveUser,
  requireAdmin,
  AdminUserController.unbanUser,
);

router.delete(
  "/:userId",
  protect,
  requireActiveUser,
  requireAdmin,
  AdminUserController.deleteUser,
);

export default router;
