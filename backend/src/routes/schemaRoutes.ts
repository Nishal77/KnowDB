import { Router } from "express";
import { getSchema, refreshSchema } from "../controllers/schemaController.js";

const router = Router();

router.get("/schema", getSchema);
router.post("/schema/refresh", refreshSchema);

export default router;

