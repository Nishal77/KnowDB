import express, { Express } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { getDetailedConnectionStatus } from "./config/db.js";

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === "production" 
      ? env.frontendUrl 
      : ["http://localhost:3000", "http://127.0.0.1:3000", env.frontendUrl],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  
  // JSON body parser with error handling
  app.use(express.json({ 
    limit: '10mb',
    strict: true 
  }));
  app.use(express.urlencoded({ 
    extended: true,
    limit: '10mb'
  }));
  
  // Handle JSON parsing errors
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction): void => {
    if (err instanceof SyntaxError && 'body' in err) {
      logger.error("JSON parsing error:", err);
      res.status(400).json({
        error: {
          message: "Invalid JSON in request body",
          statusCode: 400
        }
      });
      return;
    }
    next(err);
  });

  // Request logging
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Database status endpoint
  app.get("/api/status", (_req, res) => {
    try {
      const status = getDetailedConnectionStatus();
      res.json({
        ...status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error getting database status:", error);
      res.json({
        connected: false,
        status: "disconnected",
        message: "Unable to check database status",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // API routes
  app.use(routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

