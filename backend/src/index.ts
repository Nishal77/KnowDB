import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB (don't fail if connection fails - allow server to start)
    try {
      await connectDB();
    } catch (dbError) {
      logger.warn("⚠️  MongoDB connection failed, but server will continue to start");
      logger.warn("⚠️  Some features may not work until database is connected");
      logger.error("Database error:", dbError);
    }

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(env.port, () => {
      logger.info(`🚀 Server running on http://localhost:${env.port}`);
      logger.info(`📊 Environment: ${env.nodeEnv}`);
      logger.info(`🌐 API available at http://localhost:${env.port}/api`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();

