import { Router, type Router as ExpressRouter } from "express";
import { NotificationController } from "./notification.controller";
import { protect, requireActiveUser } from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

router.get(
  "/",
  protect,
  requireActiveUser,
  NotificationController.getMyNotifications,
);

router.get(
  "/unread",
  protect,
  requireActiveUser,
  NotificationController.getUnreadNotifications,
);

router.get(
  "/unread/count",
  protect,
  requireActiveUser,
  NotificationController.getUnreadCount,
);

router.patch(
  "/read-all",
  protect,
  requireActiveUser,
  NotificationController.markAllAsRead,
);

router.delete(
  "/read",
  protect,
  requireActiveUser,
  NotificationController.deleteReadNotifications,
);

router.patch(
  "/:notificationId/read",
  protect,
  requireActiveUser,
  NotificationController.markAsRead,
);

router.delete(
  "/:notificationId",
  protect,
  requireActiveUser,
  NotificationController.deleteNotification,
);

export default router;
