import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { NotificationService } from "./notification.service";
import { requireAuth } from "../../middleware/auth.middleware";

const getMyNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await NotificationService.getMyNotifications(user.id);

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await NotificationService.getUnreadNotifications(user.id);

    res.status(httpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const count = await NotificationService.getUnreadCount(user.id);

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = requireAuth(req);

    const result = await NotificationService.markAsRead(
      req.params.notificationId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Notification marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await NotificationService.markAllAsRead(user.id);

    res.status(httpStatus.OK).json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    await NotificationService.deleteNotification(
      req.params.notificationId as string,
      user.id,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const deleteReadNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = requireAuth(req);

    const result = await NotificationService.deleteReadNotifications(user.id);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Read notifications deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const NotificationController = {
  getMyNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
};
