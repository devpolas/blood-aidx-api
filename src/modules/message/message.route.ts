import { Router, type Router as ExpressRouter } from "express";

import { MessageController } from "./message.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  requireRole,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

router.use(protect, requireActiveUser, requireVerifiedEmail);

// Conversation Messages

router.post("/", MessageController.sendMessage);

router.get(
  "/conversation/:conversationId",
  MessageController.getConversationMessages,
);

router.patch(
  "/conversation/:conversationId/read",
  MessageController.markConversationMessagesAsRead,
);

router.get(
  "/conversation/:conversationId/unread-count",
  MessageController.getUnreadCount,
);

// Moderation
// Must be before /:messageId

router.delete(
  "/:messageId/moderate",
  requireRole("moderator", "admin"),
  MessageController.moderateDeleteMessage,
);

// Individual Message

router.get("/:messageId", MessageController.getMessageById);
router.patch("/:messageId", MessageController.updateMessage);
router.delete("/:messageId", MessageController.deleteMessage);
router.patch("/:messageId/read", MessageController.markMessageAsRead);

export default router;
