import { Router } from "express";
import aiRoutes from "./aiRoutes.js";
import schemaRoutes from "./schemaRoutes.js";
import historyRoutes from "./historyRoutes.js";

const router = Router();

// Mount routes at /api prefix
// Each route file defines its own path (e.g., /query, /schema, etc.)
router.use("/api", aiRoutes);
router.use("/api", schemaRoutes);
router.use("/api", historyRoutes);

export default router;

