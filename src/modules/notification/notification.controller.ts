import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";

export const NotificationController = {
  // Current User

  getMyNotifications: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const notifications = await NotificationService.getMyNotifications(user.id);

    sendResponse(res, {
      success: true,
      message: "Notifications retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        notifications,
      },
    });
  }),

  getUnreadNotifications: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const notifications = await NotificationService.getUnreadNotifications(
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Unread notifications retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        notifications,
      },
    });
  }),

  getUnreadCount: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const count = await NotificationService.getUnreadCount(user.id);

    sendResponse(res, {
      success: true,
      message: "Unread notification count retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        count,
      },
    });
  }),

  // Read

  markAsRead: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const notification = await NotificationService.markAsRead(
      req.params.notificationId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Notification marked as read",
      statusCode: httpStatus.OK,
      data: {
        notification,
      },
    });
  }),

  markAllAsRead: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const notifications = await NotificationService.markAllAsRead(user.id);

    sendResponse(res, {
      success: true,
      message: "All notifications marked as read",
      statusCode: httpStatus.OK,
      data: {
        notifications,
      },
    });
  }),

  // Delete

  deleteNotification: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    await NotificationService.deleteNotification(
      req.params.notificationId as string,
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Notification deleted successfully",
      statusCode: httpStatus.OK,
      data: null,
    });
  }),

  deleteReadNotifications: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const notifications = await NotificationService.deleteReadNotifications(
      user.id,
    );

    sendResponse(res, {
      success: true,
      message: "Read notifications deleted successfully",
      statusCode: httpStatus.OK,
      data: {
        notifications,
      },
    });
  }),
};
