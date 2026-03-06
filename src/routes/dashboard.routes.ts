import { Router } from "express";
import { dashboardController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";
import { getLowStockProducts } from "../services/getLowStockProducts.service";

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
  getLowStockProducts,
);
router.get(
  "/recent-transactions",
  protectRoutes,
  authorize("dashboard.view"),
  dashboardController.getRecentTransactions,
);

export default router;
