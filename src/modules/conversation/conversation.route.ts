import { Router, type Router as ExpressRouter } from "express";

import { ConversationController } from "./conversation.controller";
import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

router.use(protect, requireActiveUser, requireVerifiedEmail);

// Conversations

router.post("/", ConversationController.createConversation);
router.get("/", ConversationController.getMyConversations);
router.get("/:conversationId", ConversationController.getConversation);

// Participants

router.post(
  "/:conversationId/participants",
  ConversationController.addParticipant,
);

router.delete(
  "/:conversationId/participants/:userId",
  ConversationController.removeParticipant,
);

router.post("/:conversationId/leave", ConversationController.leaveConversation);

export default router;
