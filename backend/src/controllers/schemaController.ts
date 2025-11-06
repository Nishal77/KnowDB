import { Request, Response, NextFunction } from "express";
import { schemaService } from "../services/schemaService.js";

export async function getSchema(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const forceRefresh = req.query.refresh === "true";
    const schema = await schemaService.getSchema(forceRefresh);
    res.json(schema);
  } catch (error) {
    next(error);
  }
}

export async function refreshSchema(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schema = await schemaService.refreshSchema();
    res.json({
      message: "Schema refreshed successfully",
      schema,
    });
  } catch (error) {
    next(error);
  }
}



