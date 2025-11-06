import mongoose from "mongoose";
import { QueryLog } from "../models/QueryLog.js";
import type { IQueryLog } from "../models/QueryLog.js";
import { logger } from "../config/logger.js";

class HistoryService {
  async saveQuery(
    conversationId: string,
    userQuery: string,
    generatedQuery: string,
    result: unknown,
    executionTime?: number,
    error?: string,
    userId?: string
  ): Promise<IQueryLog | null> {
    // Skip saving if no valid query was generated (e.g., AI returned error)
    if (!generatedQuery || !generatedQuery.trim()) {
      logger.debug("Skipping query log — no valid query generated.");
      return null;
    }

    // Check if MongoDB is connected
    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      logger.warn("MongoDB not connected, skipping history save");
      throw new Error("Database connection not available");
    }

    try {
      const queryLog = new QueryLog({
        conversationId,
        userId,
        userQuery,
        generatedQuery,
        result,
        executionTime,
        error,
        timestamp: new Date(),
      });

      // Set a timeout for the save operation
      const savePromise = queryLog.save();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Save operation timed out")), 5000);
      });

      await Promise.race([savePromise, timeoutPromise]);
      return queryLog;
    } catch (error) {
      logger.error("Error saving query log:", error);
      throw error;
    }
  }

  async getConversationHistory(conversationId: string): Promise<IQueryLog[]> {
    try {
      const logs = await QueryLog.find({ conversationId })
        .sort({ timestamp: 1 })
        .limit(100)
        .lean();

      return logs as IQueryLog[];
    } catch (error) {
      logger.error("Error fetching conversation history:", error);
      throw error;
    }
  }

  async getUserHistory(userId: string, limit = 50): Promise<IQueryLog[]> {
    try {
      const logs = await QueryLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return logs as IQueryLog[];
    } catch (error) {
      logger.error("Error fetching user history:", error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await QueryLog.deleteMany({ conversationId });
    } catch (error) {
      logger.error("Error deleting conversation:", error);
      throw error;
    }
  }
}

export const historyService = new HistoryService();

