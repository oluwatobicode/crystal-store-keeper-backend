import { Router } from "express";
import { dashboardController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

router.get(
  "/analysis",
  protectRoutes,
  authorize("dashboard.view"),
  dashboardController.dashboardAnalysis,
);
router.get(
  "/low-stock",
  protectRoutes,
  authorize("dashboard.view"),
  dashboardController.getLowStockProducts,
);
router.get(
  "/recent-transactions",
  protectRoutes,
  authorize("dashboard.view"),
  dashboardController.getRecentTransactions,
);

export default router;
