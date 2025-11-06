import { Request, Response, NextFunction } from "express";
import { MAX_QUERY_LENGTH } from "../utils/constants.js";
import type { AppError } from "./errorHandler.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

/**
 * Validates incoming query requests
 * Ensures request body contains a valid, non-empty query string
 */
export function validateQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log request details for debugging (only in development)
  if (env.nodeEnv === "development") {
    logger.info("validateQuery - Request body:", JSON.stringify(req.body));
    logger.info("validateQuery - Content-Type:", req.headers["content-type"]);
  }

  // Check if body exists
  if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
    const error: AppError = new Error("Request body is required and cannot be empty");
    error.statusCode = 400;
    error.isOperational = true;
    logger.warn("validateQuery - Missing or empty request body");
    return next(error);
  }

  const { query } = req.body;

  if (!query) {
    const error: AppError = new Error("Query field is required in request body. Received body: " + JSON.stringify(req.body));
    error.statusCode = 400;
    error.isOperational = true;
    logger.warn("validateQuery - Missing query field. Body keys:", Object.keys(req.body));
    return next(error);
  }

  if (typeof query !== "string") {
    const error: AppError = new Error(`Query must be a string, received ${typeof query}`);
    error.statusCode = 400;
    error.isOperational = true;
    logger.warn("validateQuery - Query is not a string. Type:", typeof query, "Value:", query);
    return next(error);
  }

  if (query.trim().length === 0) {
    const error: AppError = new Error("Query cannot be empty");
    error.statusCode = 400;
    error.isOperational = true;
    logger.warn("validateQuery - Query is empty after trim");
    return next(error);
  }

  if (query.length > MAX_QUERY_LENGTH) {
    const error: AppError = new Error(
      `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters (received ${query.length})`
    );
    error.statusCode = 400;
    error.isOperational = true;
    logger.warn("validateQuery - Query too long:", query.length, "chars");
    return next(error);
  }

  // Validation passed
  if (env.nodeEnv === "development") {
    logger.info("validateQuery - Validation passed for query:", query.substring(0, 50) + "...");
  }

  next();
}



