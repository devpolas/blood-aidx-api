import { Router, type Router as ExpressRouter } from "express";
import { ConversationController } from "./conversation.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Protected Routes

router.use(protect, requireActiveUser, requireVerifiedEmail);

// Conversations

router.get("/", ConversationController.getMyConversations);
router.post("/", ConversationController.createConversation);

// Participant Management

router.post(
  "/:conversationId/participants",
  ConversationController.addParticipant,
);

router.delete(
  "/:conversationId/participants/:userId",
  ConversationController.removeParticipant,
);

router.post("/:conversationId/leave", ConversationController.leaveConversation);

// Conversation Details

// Keep this LAST because /:conversationId
// can otherwise catch other static routes.
router.get("/:conversationId", ConversationController.getConversation);

export default router;
