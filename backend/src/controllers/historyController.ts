import { Request, Response, NextFunction } from "express";
import { historyService } from "../services/historyService.js";

export async function getConversationHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    const history = await historyService.getConversationHistory(conversationId);
    
    // Transform to match frontend Message format
    const messages = history.map((log) => ({
      id: (log._id as any).toString(),
      role: "assistant" as const,
      content: log.userQuery,
      timestamp: log.timestamp,
      queryResult: {
        query: log.generatedQuery,
        result: log.result,
        executionTime: log.executionTime,
        error: log.error,
      },
    }));

    res.json(messages);
  } catch (error) {
    next(error);
  }
}

export async function deleteConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    await historyService.deleteConversation(conversationId);
    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    next(error);
  }
}



