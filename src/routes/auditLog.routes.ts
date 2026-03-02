import { Router } from "express";
import { auditLogController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

router.get(
  "/",
  protectRoutes,
  authorize("audit.view"),
  auditLogController.getAllLogs,
);
router.get(
  "/export-csv",
  protectRoutes,
  authorize("audit.view"),
  auditLogController.exportLogs,
);

export default router;
