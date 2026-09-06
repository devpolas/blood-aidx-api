import httpStatus from "http-status";

import { db } from "../../lib/db";
import { AppError } from "../../utils/appError";

import type { CreateNotificationInput } from "./notification.schema";

const getNotificationById = async (notificationId: string, userId: string) => {
  const notification = await db.orm.public.Notification.where({
    id: notificationId,
  }).first();

  if (!notification) {
    throw new AppError("Notification not found", httpStatus.NOT_FOUND);
  }

  if (notification.userId !== userId) {
    throw new AppError(
      "You do not have access to this notification",
      httpStatus.FORBIDDEN,
    );
  }

  return notification;
};

const createNotification = async (data: CreateNotificationInput) => {
  const user = await db.orm.public.User.where({
    id: data.userId,
  }).first();

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return db.orm.public.Notification.create({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,

    ...(data.data !== undefined && {
      data: data.data,
    }),
  });
};

const getMyNotifications = async (userId: string) => {
  return db.orm.public.Notification.where({
    userId,
  }).all();
};

const getUnreadNotifications = async (userId: string) => {
  const notifications = await db.orm.public.Notification.where({
    userId,
    readAt: null,
  }).all();

  return notifications;
};

const getUnreadCount = async (userId: string) => {
  const notifications = await db.orm.public.Notification.where({
    userId,
    readAt: null,
  }).all();

  return notifications.length;
};

const markAsRead = async (notificationId: string, userId: string) => {
  await getNotificationById(notificationId, userId);

  return db.orm.public.Notification.where({
    id: notificationId,
  }).update({
    readAt: new Date().toISOString(),
  });
};

const markAllAsRead = async (userId: string) => {
  const notifications = await db.orm.public.Notification.where({
    userId,
    readAt: null,
  }).all();

  const readAt = new Date().toISOString();

  await Promise.all(
    notifications.map((notification) =>
      db.orm.public.Notification.where({
        id: notification.id,
      }).update({
        readAt,
      }),
    ),
  );

  return {
    count: notifications.length,
  };
};

const deleteNotification = async (notificationId: string, userId: string) => {
  await getNotificationById(notificationId, userId);

  await db.orm.public.Notification.where({
    id: notificationId,
  }).delete();
};

const deleteReadNotifications = async (userId: string) => {
  const readNotifications = await db.orm.public.Notification.where({
    userId,
  }).all();

  const notificationsToDelete = readNotifications.filter(
    (notification) => notification.readAt !== null,
  );

  await Promise.all(
    notificationsToDelete.map((notification) =>
      db.orm.public.Notification.where({
        id: notification.id,
      }).delete(),
    ),
  );

  return {
    count: notificationsToDelete.length,
  };
};

export const NotificationService = {
  createNotification,
  getMyNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
};
