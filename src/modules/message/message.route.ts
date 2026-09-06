import { Router, type Router as ExpressRouter } from "express";

import { MessageController } from "./message.controller";
import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

router.use(protect, requireActiveUser, requireVerifiedEmail);

// Conversation messages

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

// Individual message

router.get("/:messageId", MessageController.getMessageById);
router.patch("/:messageId", MessageController.updateMessage);
router.delete("/:messageId", MessageController.deleteMessage);
router.patch("/:messageId/read", MessageController.markMessageAsRead);

export default router;
