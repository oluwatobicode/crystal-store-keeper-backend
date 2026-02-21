import { Router } from "express";
import { auditLogController } from "../controllers";

const router = Router();

router.get("/", auditLogController.getAllLogs);
router.get("/export-csv", auditLogController.exportLogs);

export default router;
