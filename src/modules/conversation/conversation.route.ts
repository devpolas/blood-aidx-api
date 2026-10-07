import { Router, type Router as ExpressRouter } from "express";

import { ConversationController } from "./conversation.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Conversations
router.get(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ConversationController.getMyConversations,
);

router.post(
  "/",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ConversationController.createConversation,
);

// Participant Management
router.post(
  "/:conversationId/participants",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ConversationController.addParticipant,
);

router.delete(
  "/:conversationId/participants/:userId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ConversationController.removeParticipant,
);

router.post(
  "/:conversationId/leave",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ConversationController.leaveConversation,
);

// Conversation Details
router.get(
  "/:conversationId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  ConversationController.getConversation,
);

export default router;
