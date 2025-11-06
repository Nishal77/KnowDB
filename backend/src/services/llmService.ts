import OpenAI from "openai";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { DatabaseSchema } from "../interfaces/Schema.js";
import type { AIQueryResponse } from "../interfaces/AIResponse.js";
import { QUERY_GENIE_SYSTEM_PROMPT } from "../utils/systemPrompts.js";
import { schemaService } from "./schemaService.js";

/**
 * LLM Service for generating MongoDB queries from natural language
 * Uses OpenAI API (or OpenRouter) to convert user queries into MongoDB queries
 */

class LLMService {
  private client: OpenAI | null = null;

  constructor() {
    if (env.openaiApiKey) {
      // Check if this is an OpenRouter API key (starts with sk-or-v1-)
      const isOpenRouter = env.openaiApiKey.startsWith("sk-or-v1-");
      
      this.client = new OpenAI({
        apiKey: env.openaiApiKey,
        baseURL: isOpenRouter 
          ? "https://openrouter.ai/api/v1" 
          : undefined, // Use default OpenAI endpoint
      });
      
      if (isOpenRouter) {
        logger.info("Using OpenRouter API for AI queries");
      }
    } else {
      logger.warn("OpenAI API key not found. AI features disabled.");
    }
  }

  async generateQuery(
    userQuery: string,
    schema: DatabaseSchema
  ): Promise<AIQueryResponse> {
    if (!this.client) {
      throw new Error("OpenAI client not initialized. Check OPENAI_API_KEY.");
    }

    try {
      // Detect if this is an introspection query (needs collection names or database info)
      const isIntrospectionQuery = this.detectIntrospectionQuery(userQuery);
      
      // Format schema as JSON object grouped by database
      // Structure: { "databaseName": { "collectionName": { "field": "type" } } }
      const schemaObj: Record<string, Record<string, Record<string, string>>> = {};
      
      // Group collections by database
      schema.databases.forEach((database) => {
        const dbCollections: Record<string, Record<string, string>> = {};
        database.collections.forEach((collection) => {
          const fields: Record<string, string> = {};
          collection.fields.forEach((field) => {
            fields[field.name] = field.type;
          });
          // Collection name without database prefix
          dbCollections[collection.name] = fields;
        });
        // Database name as top-level key
        schemaObj[database.name] = dbCollections;
      });
      
      // If introspection query detected, enhance schema context with actual collection names
      if (isIntrospectionQuery) {
        try {
          const allDatabaseNames = await schemaService.getAllDatabaseNames();
          
          // Build collections grouped by database (for display)
          const collectionsByDb: Record<string, string[]> = {};
          schema.databases.forEach((database) => {
            collectionsByDb[database.name] = database.collections.map((col) => col.name);
          });
          
          // Add metadata to schema context
          schemaObj._metadata = {
            availableDatabases: allDatabaseNames,
            collectionsByDatabase: collectionsByDb,
            note: "Schema is grouped by database. Each database contains collections. Collection names are shown without database prefix.",
          };
          
          logger.info(`Enhanced schema context for introspection: ${allDatabaseNames.length} databases found`);
        } catch (introspectionError) {
          logger.warn("Failed to fetch collection names for introspection, using schema only:", introspectionError);
        }
      }
      
      // Format schema as JSON string (compact format for prompt)
      const schemaString = JSON.stringify(schemaObj, null, 2);
      
      // Build user prompt following the system prompt's INPUT STRUCTURE format:
      // "Schema: { ... }\nUser: <query>"
      const userPrompt = `Schema: ${schemaString}\nUser: ${userQuery}`;

      // Log for debugging (only in development)
      if (env.nodeEnv === "development") {
        logger.info("=== AI Query Generation Debug ===");
        logger.info("Schema (first 300 chars):", schemaString.substring(0, 300));
        logger.info("User query:", userQuery);
        logger.info("Schema collections count:", schema.collections.length);
        logger.info("Schema object keys:", Object.keys(schemaObj).join(", ") || "none");
      }

      // Build request options
      const requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: "gpt-4o-mini", // Using cheaper model, can be upgraded to gpt-4
        messages: [
          {
            role: "system",
            content: QUERY_GENIE_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.1, // Lower temperature for more consistent responses
        max_tokens: 1000, // Increased for JSON responses
      };

      // Add JSON mode if supported (OpenAI models support it, some OpenRouter models may not)
      // Check if using OpenAI directly (not OpenRouter) or if model supports JSON mode
      const isOpenRouter = env.openaiApiKey.startsWith("sk-or-v1-");
      if (!isOpenRouter) {
        // OpenAI models support JSON mode - this requires the system message to mention JSON
        requestOptions.response_format = { type: "json_object" };
      }

      const response = await this.client.chat.completions.create(requestOptions);

      const content = response.choices[0]?.message?.content || "";
      
      // Log AI response for debugging (only in development)
      if (env.nodeEnv === "development") {
        logger.info("AI Response (first 500 chars):", content.substring(0, 500));
      }
      
      const parsedResponse = parseAIResponse(content);

      // Handle greeting/conversation messages (e.g., "hello", "thank you")
      if (parsedResponse.message) {
        logger.info("AI returned greeting message:", parsedResponse.message);
        return {
          query: "",
          explanation: parsedResponse.message,
          confidence: 1.0,
          collection: undefined,
          operation: undefined,
          message: parsedResponse.message, // Include message in response
        };
      }

      // Check if there's an error in the response
      // Don't throw - return error response so controller can handle it gracefully
      if (parsedResponse.error) {
        logger.warn("AI returned error response:", parsedResponse.error);
        if (env.nodeEnv === "development") {
          logger.debug("Full AI response:", content);
        }
        
        // Return error response instead of throwing
        return {
          query: "",
          explanation: parsedResponse.error,
          confidence: 0,
          collection: undefined,
          operation: undefined,
          error: parsedResponse.error, // Include error in response
        };
      }

      return {
        query: parsedResponse.query || "",
        explanation: parsedResponse.explanation,
        confidence: parsedResponse.safety_check === "Passed" ? 0.9 : 0.5,
        collection: parsedResponse.collection,
        operation: parsedResponse.operation,
      };
    } catch (error) {
      logger.error("Error generating query with LLM:", error);
      
      // Safely extract error message
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle error objects
        errorMessage = (error as any)?.message || (error as any)?.error || JSON.stringify(error);
      }
      
      throw new Error(`Failed to generate query: ${errorMessage}`);
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Detects if a user query is requesting database introspection
   * (e.g., "show all collections", "get database name", "list collections")
   */
  private detectIntrospectionQuery(userQuery: string): boolean {
    const query = userQuery.toLowerCase();
    const introspectionKeywords = [
      "show all collections",
      "list collections",
      "what collections",
      "get database name",
      "database name",
      "show entire schema",
      "display all data",
      "show everything",
      "all collections",
      "collections in",
      "what's in my database",
      "what is in my database",
      "list all",
      "show schema",
      "database structure",
    ];
    
    return introspectionKeywords.some((keyword) => query.includes(keyword));
  }
}

interface ParsedAIResponse {
  collection?: string;
  operation?: string;
  query?: string;
  explanation?: string;
  safety_check?: string;
  error?: string;
  message?: string; // For greeting/conversation responses
}

function parseAIResponse(content: string): ParsedAIResponse {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content.trim());
    
    // Handle greeting/conversation messages (e.g., "hello")
    if (parsed.message) {
      return {
        message: parsed.message,
        query: "", // No query for greetings
      };
    }
    
    // Validate the response structure
    if (parsed.error) {
      // Ensure error is always a string, even if it's an object
      const errorMessage = typeof parsed.error === 'string' 
        ? parsed.error 
        : parsed.error?.message || JSON.stringify(parsed.error);
      return { error: errorMessage };
    }
    
    // Check if we have a query (most important field)
    if (parsed.query) {
      return {
        query: parsed.query,
        collection: parsed.collection || "unknown",
        operation: parsed.operation || "find",
        explanation: parsed.explanation || "Query generated",
        safety_check: parsed.safety_check || "Unknown",
      };
    }
    
    // If no query but has collection and operation, try to construct
    if (parsed.collection && parsed.operation) {
      return {
        query: `db.${parsed.collection}.${parsed.operation}({})`,
        collection: parsed.collection,
        operation: parsed.operation,
        explanation: parsed.explanation || "Query generated",
        safety_check: parsed.safety_check || "Unknown",
      };
    }
    
    throw new Error("Invalid response structure: missing query");
  } catch (parseError) {
    // If JSON parsing fails, try to extract query from text
    logger.warn("Failed to parse JSON response, attempting fallback extraction:", parseError);
    
    // Try to find JSON object in the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parseAIResponse(JSON.stringify(parsed));
      } catch {
        // Continue to fallback
      }
    }
    
    // Fallback: try to extract query from text
    const dbPattern = /db\.\w+\.(?:find|findOne|aggregate|insertOne|updateOne|updateMany|deleteOne|deleteMany|countDocuments)\([^)]*\)/;
    const dbMatch = content.match(dbPattern);
    
    if (dbMatch) {
      return {
        query: dbMatch[0],
        explanation: "Query extracted from response",
        safety_check: "Unknown",
      };
    }
    
    // Last resort: return error
    return {
      error: "Unable to parse AI response. Please try rephrasing your query.",
    };
  }
}

export const llmService = new LLMService();

