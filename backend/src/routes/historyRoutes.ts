import { Router } from "express";
import {
  getConversationHistory,
  deleteConversation,
} from "../controllers/historyController.js";

const router = Router();

router.get("/conversations/:conversationId", getConversationHistory);
router.delete("/conversations/:conversationId", deleteConversation);

export default router;

