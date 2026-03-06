import { Router } from "express";
import { backupController } from "../controllers";
import { protectRoutes } from "../middleware/auth.middlware";

const router = Router();

router.get(
  "/customers/export-csv",
  protectRoutes,
  backupController.exportCustomers,
);

router.get("/sales/export-csv", protectRoutes, backupController.exportSales);

router.get(
  "/inventory/export-csv",
  protectRoutes,
  backupController.exportInventory,
);

export default router;
