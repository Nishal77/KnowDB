import { Request, Response, NextFunction } from "express";
import { llmService } from "../services/llmService.js";
import { schemaService } from "../services/schemaService.js";
import { dbService } from "../services/dbService.js";
import { historyService } from "../services/historyService.js";
import { formatQueryResult } from "../utils/responseFormatter.js";
import { generateId } from "../utils/idGenerator.js";
import type { QueryResponse } from "../interfaces/Query.js";
import type { AppError } from "../middleware/errorHandler.js";
import { logger } from "../config/logger.js";

export async function processQuery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      const error: AppError = new Error("Invalid request body");
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    const { query: userQuery, conversationId } = req.body;

    // Validate user query
    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
      const error: AppError = new Error("Query is required and must be a non-empty string");
      error.statusCode = 400;
      error.isOperational = true;
      return next(error);
    }

    // Get or create conversation ID
    const convId = conversationId || generateId();
    const isNewConversation = !conversationId;

    // Check if this is a greeting or first interaction
    const isGreeting = /^(hi|hello|hey|greetings|good (morning|afternoon|evening))$/i.test(userQuery.trim());

    // If it's a new conversation and user sent a greeting, respond with greeting
    if (isNewConversation && isGreeting) {
      const greetingMessage: QueryResponse["message"] = {
        id: generateId(),
        role: "assistant",
        content: "Hello! 👋 I'm your AI database assistant. I can help you query and analyze your MongoDB database using natural language. What would you like to know about your data?",
        timestamp: new Date(),
      };

      const response: QueryResponse = {
        conversationId: convId,
        message: greetingMessage,
        result: {
          query: "",
          result: null,
        },
      };

      // Try to save greeting to history (non-blocking)
      try {
        await historyService.saveQuery(
          convId,
          userQuery,
          "",
          null,
          undefined,
          undefined
        );
      } catch (historyError) {
        // Ignore history errors for greetings
        logger.debug("Failed to save greeting history (non-critical):", historyError);
      }

      res.json(response);
      return;
    }

    // Get database schema (handle case where DB might not be connected)
    let schema;
    try {
      schema = await schemaService.getSchema();
    } catch (schemaError) {
      logger.warn("Failed to get schema, using empty schema:", schemaError);
      schema = { collections: [] };
    }

    // Generate MongoDB query using AI
    if (!llmService.isAvailable()) {
      const error: AppError = new Error("AI service is not available. Check OPENAI_API_KEY.");
      error.statusCode = 503;
      error.isOperational = true;
      return next(error);
    }

    let aiResponse;
    let generatedQuery: string;
    
    try {
      aiResponse = await llmService.generateQuery(userQuery, schema);
      
      // Handle greeting/conversation messages (e.g., "hello", "thank you")
      if (aiResponse.message) {
        logger.info("AI returned greeting message:", aiResponse.message);
        
        const greetingResponse: QueryResponse = {
          conversationId: convId,
          message: {
            id: generateId(),
            role: "assistant",
            content: aiResponse.message,
            timestamp: new Date(),
            queryResult: {
              query: "",
              result: null,
            },
          },
          result: {
            query: "",
            result: null,
          },
        };
        
        // Return 200 with greeting message
        res.status(200).json(greetingResponse);
        return;
      }
      
      // Check if AI returned an error response (non-fatal, user-level issue)
      if (aiResponse.error) {
        logger.info("AI returned error response (non-fatal):", aiResponse.error);
        
        const errorResponse: QueryResponse = {
          conversationId: convId,
          message: {
            id: generateId(),
            role: "assistant",
            content: aiResponse.error,
            timestamp: new Date(),
            queryResult: {
              query: "",
              result: null,
            },
          },
          result: {
            query: "",
            result: null,
          },
        };
        
        // Return 200 with error message (not 400) - this is a valid response, just not a query
        res.status(200).json(errorResponse);
        return;
      }
      
      generatedQuery = aiResponse.query;
      
      // Validate that we got a query
      if (!generatedQuery || !generatedQuery.trim()) {
        throw new Error("AI did not generate a valid query. Please try rephrasing your question.");
      }
    } catch (aiError) {
      // This catch block handles actual errors (network issues, API failures, etc.)
      logger.error("AI query generation error (fatal):", aiError);
      
      // Safely extract error message - ensure it's always a string
      let errorMessage = "Failed to generate query. Please check your OpenAI API key and try again.";
      
      if (aiError instanceof Error) {
        errorMessage = aiError.message;
      } else if (typeof aiError === 'string') {
        errorMessage = aiError;
      } else if (aiError && typeof aiError === 'object') {
        // Handle error objects - extract message or stringify
        const errorObj = aiError as any;
        errorMessage = errorObj?.message || errorObj?.error || errorObj?.toString() || JSON.stringify(aiError);
      }
      
      const errorResponse: QueryResponse = {
        conversationId: convId,
        message: {
          id: generateId(),
          role: "assistant",
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
          queryResult: {
            query: "",
            result: null,
          },
        },
        result: {
          query: "",
          result: null,
        },
      };
      
      res.status(400).json(errorResponse);
      return;
    }

    // Execute query
    let result: unknown;
    let executionTime: number | undefined;
    let queryError: string | undefined;

    try {
      const execStart = Date.now();
      result = await dbService.executeQuery(generatedQuery);
      executionTime = Date.now() - execStart;
    } catch (error) {
      // Safely extract error message
      if (error instanceof Error) {
        queryError = error.message;
      } else if (typeof error === 'string') {
        queryError = error;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        queryError = errorObj?.message || errorObj?.error || errorObj?.toString() || "Unknown error";
      } else {
        queryError = "Unknown error";
      }
      logger.error("Query execution error:", error);
      result = null;
    }

    // Format response
    const queryResult = formatQueryResult(
      result,
      generatedQuery,
      executionTime,
      queryError
    );

    // Create assistant message with unique ID
    const messageId = generateId();
    
    // For new conversations, add a friendly greeting before the response
    let content = queryError
      ? `Error: ${queryError}`
      : aiResponse.explanation || "Query executed successfully";
    
    if (isNewConversation && !isGreeting) {
      content = `Hello! 👋 ${content}`;
    }
    
    const assistantMessage: QueryResponse["message"] = {
      id: messageId,
      role: "assistant",
      content,
      timestamp: new Date(),
      queryResult,
    };

    // Prepare response first
    const response: QueryResponse = {
      conversationId: convId,
      message: assistantMessage,
      result: queryResult,
    };

    // Query history saving disabled - queries are now stored in browser local storage only
    // This prevents user queries from being stored in the database
    // Uncomment below to re-enable database storage:
    /*
    // Only save to history if we have a valid generated query
    if (generatedQuery && generatedQuery.trim()) {
      try {
        await historyService.saveQuery(
          convId,
          userQuery,
          generatedQuery,
          result,
          executionTime,
          queryError
        );
      } catch (historyError) {
        logger.warn("Failed to save query history (non-critical):", historyError);
      }
    } else {
      logger.debug("Skipping query log — no valid query generated.");
    }
    */

    // Send response even if history saving failed
    res.json(response);
  } catch (error) {
    next(error);
  }
}

