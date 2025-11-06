import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

/**
 * Connection state tracking
 */
let isConnected = false;

/**
 * MongoDB connection options optimized for both Atlas and local connections
 * Uses configuration from .env.local (MONGO_URI)
 */
function getConnectionOptions(): mongoose.ConnectOptions {
  const isAtlas = env.mongoUri.startsWith("mongodb+srv://");
  
  return {
    // Timeout configurations (important for Atlas)
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 30000, // 30 seconds
    
    // SSL/TLS configuration
    // For mongodb+srv:// (Atlas), SSL/TLS is automatic
    // For regular mongodb://, configure SSL if needed
    ...(isAtlas ? {} : {
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    }),
    
    // Connection pool settings
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 1, // Minimum number of connections to maintain
    
    // Retry configuration
    retryWrites: true, // Retry write operations on transient errors
    retryReads: true, // Retry read operations on transient errors
    
    // Connection health monitoring
    heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
  };
}

/**
 * Connects to MongoDB using the connection string from .env.local
 * Uses Mongoose for connection management and connection pooling
 * 
 * @throws {Error} If connection fails
 */
export async function connectDB(): Promise<void> {
  if (isConnected) {
    logger.debug("MongoDB already connected, skipping connection attempt");
    return;
  }

  try {
    const connectionOptions = getConnectionOptions();
    
    logger.info("Connecting to MongoDB...");
    logger.debug(`Connection URI: ${env.mongoUri.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs
    
    await mongoose.connect(env.mongoUri, connectionOptions);
    
    isConnected = true;
    const dbName = mongoose.connection.db?.databaseName || "unknown";
    
    logger.info("✅ MongoDB connected successfully");
    logger.info(`📊 Database: ${dbName}`);
    logger.info(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Set up connection event handlers
    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error:", error);
      isConnected = false;
    });
    
    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
      isConnected = false;
    });
    
    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
      isConnected = true;
    });
    
  } catch (error) {
    isConnected = false;
    logger.error("❌ MongoDB connection failed");
    
    if (error instanceof Error) {
      logger.error(`Error message: ${error.message}`);
      if (env.nodeEnv === "development") {
        logger.error(`Error stack: ${error.stack}`);
      }
    }
    
    throw new Error(
      `Failed to connect to MongoDB. Please check your MONGO_URI in .env.local. ` +
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Disconnects from MongoDB gracefully
 * Should be called during application shutdown
 */
export async function disconnectDB(): Promise<void> {
  if (!isConnected) {
    logger.debug("MongoDB not connected, skipping disconnect");
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected gracefully");
  } catch (error) {
    logger.error("Error disconnecting from MongoDB:", error);
    isConnected = false;
    throw error;
  }
}

export function getConnectionStatus(): boolean {
  return isConnected;
}

export function getDetailedConnectionStatus(): {
  connected: boolean;
  status: "connected" | "connecting" | "disconnected" | "warning";
  message: string;
  readyState?: number;
} {
  const readyState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  
  if (readyState === 1) {
    return {
      connected: true,
      status: "connected",
      message: "Database connected • All systems operational",
      readyState: 1,
    };
  }
  
  if (readyState === 2) {
    return {
      connected: false,
      status: "connecting",
      message: "Establishing database connection...",
      readyState: 2,
    };
  }
  
  // Check if there's a minor issue (like schema fetch failure but connection exists)
  if (readyState === 0 || readyState === 3) {
    // Try to check if we can at least ping the connection
    try {
      // If mongoose is configured but not connected, it's a connection issue
      if (mongoose.connection.host) {
        return {
          connected: false,
          status: "warning",
          message: "Database connection unstable • Minor issues detected",
          readyState,
        };
      }
    } catch {
      // Ignore
    }
    
    return {
      connected: false,
      status: "disconnected",
      message: "Connection lost • Database unavailable",
      readyState,
    };
  }
  
  return {
    connected: false,
    status: "disconnected",
    message: "Database connection unavailable",
    readyState,
  };
}

