import { Router, type Router as ExpressRouter } from "express";

import { MessageController } from "./message.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Conversation Messages
router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MessageController.sendMessage,
);

router.get(
  "/conversation/:conversationId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MessageController.getConversationMessages,
);

router.patch(
  "/conversation/:conversationId/read",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MessageController.markConversationMessagesAsRead,
);

router.get(
  "/conversation/:conversationId/unread-count",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MessageController.getUnreadCount,
);

// Moderation
router.delete(
  "/:messageId/moderate",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole("moderator", "admin"),
  MessageController.moderateDeleteMessage,
);

// Individual Message Actions
router.patch(
  "/:messageId/read",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MessageController.markMessageAsRead,
);

// Individual Message
router.get(
  "/:messageId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MessageController.getMessageById,
);

router.patch(
  "/:messageId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MessageController.updateMessage,
);

router.delete(
  "/:messageId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  MessageController.deleteMessage,
);

export default router;
