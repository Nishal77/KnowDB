import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local first (highest priority), then .env as fallback
// This ensures .env.local takes precedence over .env
const envLocalPath = join(__dirname, "../../.env.local");
const envPath = join(__dirname, "../../.env");

// Load .env.local first (will override .env if both exist)
const envLocalResult = dotenv.config({ path: envLocalPath });
const envResult = dotenv.config({ path: envPath });

// Log which env files were loaded (only in development)
if (process.env.NODE_ENV === "development") {
  if (envLocalResult.error && envResult.error) {
    console.warn("⚠️  No .env.local or .env file found. Using system environment variables.");
  } else {
    if (!envLocalResult.error) {
      console.log("✅ Loaded environment variables from .env.local");
    }
    if (!envResult.error && envLocalResult.error) {
      console.log("✅ Loaded environment variables from .env");
    }
  }
}

/**
 * Normalizes MongoDB connection URI to ensure proper configuration
 * - Keeps database name if present (for app collections like querylogs)
 * - If no database specified, connects without one to access all databases
 * - Ensures retryWrites and write concern for Atlas connections
 */
function normalizeMongoUri(uri: string): string {
  if (!uri || uri.trim() === "") {
    throw new Error("MONGO_URI is required but not set in .env.local");
  }

  // For mongodb+srv:// (Atlas), SSL is automatic
  if (uri.startsWith("mongodb+srv://")) {
    const hasDbName = /mongodb\+srv:\/\/[^/]+\/[^/?]+/.test(uri);
    
    if (hasDbName) {
      // Database name exists, ensure retryWrites is in query string
      if (uri.includes("?")) {
        if (!uri.includes("retryWrites")) {
          return `${uri}&retryWrites=true&w=majority`;
        }
      } else {
        return `${uri}?retryWrites=true&w=majority`;
      }
      return uri;
    } else {
      // No database name specified - connect without one to access all databases
      // Add retryWrites to query string
      if (uri.includes("?")) {
        if (!uri.includes("retryWrites")) {
          return `${uri}&retryWrites=true&w=majority`;
        }
        return uri;
      } else {
        return `${uri}?retryWrites=true&w=majority`;
      }
    }
  }
  
  // For regular mongodb:// connections
  if (uri.match(/\/[^/?]+(\?|$)/)) {
    // Already has database name, ensure retryWrites
    if (uri.includes("?") && !uri.includes("retryWrites")) {
      return `${uri}&retryWrites=true&w=majority`;
    } else if (!uri.includes("?")) {
      return `${uri}?retryWrites=true&w=majority`;
    }
    return uri;
  }
  
  // No database specified - connect without one (can access all databases)
  if (uri.includes("?")) {
    if (!uri.includes("retryWrites")) {
      return `${uri}&retryWrites=true&w=majority`;
    }
    return uri;
  }
  return `${uri}?retryWrites=true&w=majority`;
}

/**
 * Extracts database name from MongoDB URI if present
 */
function extractDbNameFromUri(uri: string): string | null {
  const match = uri.match(/\/\/(?:[^/]+@)?[^/]+\/([^/?]+)/);
  return match ? match[1] : null;
}

/**
 * Validates that required environment variables are set
 */
function validateEnv(): void {
  const requiredVars: Array<{ key: string; value: string | undefined; name: string }> = [
    { key: "MONGO_URI", value: process.env.MONGO_URI, name: "MongoDB connection string" },
  ];

  const missingVars = requiredVars.filter(({ value }) => !value);
  
  if (missingVars.length > 0) {
    const missing = missingVars.map(({ key }) => key).join(", ");
    throw new Error(
      `Missing required environment variables in .env.local: ${missing}\n` +
      `Please ensure these variables are set in your .env.local file.`
    );
  }
}

// Validate required environment variables
validateEnv();

/**
 * Environment configuration object
 * All values are loaded from .env.local (highest priority) or .env (fallback)
 */
export const env = {
  // Server configuration
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: (process.env.NODE_ENV || "development") as "development" | "production" | "test",
  
  // MongoDB - loaded from .env.local, normalized for proper connection
  mongoUri: normalizeMongoUri(process.env.MONGO_URI!),
  
  // OpenAI API - loaded from .env.local
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  
  // CORS configuration
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  
  // JWT Secret (for future authentication)
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
} as const;

// Warn if OpenAI API key is missing (non-critical for development)
if (!env.openaiApiKey) {
  if (env.nodeEnv === "production") {
    console.warn("⚠️  OPENAI_API_KEY is not set. AI features will not work.");
  } else {
    console.warn("⚠️  OPENAI_API_KEY is not set in .env.local. AI features will not work.");
  }
}

// Warn if using default JWT secret in production
if (env.nodeEnv === "production" && env.jwtSecret === "your-secret-key-change-in-production") {
  console.warn("⚠️  Using default JWT_SECRET. Please set a secure secret in production.");
}

