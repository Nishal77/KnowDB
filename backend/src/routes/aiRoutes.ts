import { Router } from "express";
import { processQuery } from "../controllers/aiController.js";
import { validateQuery } from "../middleware/validateQuery.js";

const router = Router();

router.post("/query", validateQuery, processQuery);

export default router;



