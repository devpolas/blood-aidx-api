import type { Request, Response } from "express";

import httpStatus from "http-status";

import { NotificationService } from "./notification.service";

import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await NotificationService.getMyNotifications(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    data: result,
  });
});

const getUnreadNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const result = await NotificationService.getUnreadNotifications(user.id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Unread notifications retrieved successfully",
      data: result,
    });
  },
);

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const count = await NotificationService.getUnreadCount(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unread notification count retrieved successfully",
    data: {
      count,
    },
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await NotificationService.markAsRead(
    req.params.notificationId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked as read",
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const result = await NotificationService.markAllAsRead(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notifications marked as read",
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  await NotificationService.deleteNotification(
    req.params.notificationId as string,
    user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification deleted successfully",
  });
});

const deleteReadNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const result = await NotificationService.deleteReadNotifications(user.id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Read notifications deleted successfully",
      data: result,
    });
  },
);

export const NotificationController = {
  getMyNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
};
