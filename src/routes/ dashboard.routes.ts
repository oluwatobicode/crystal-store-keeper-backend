import { Router } from "express";
import { dashboardController } from "../controllers";

const router = Router();

router.get("/analysis", dashboardController.dashboardAnalysis);
router.get("/low-stock", dashboardController.getLowStockProducts);
router.get("/recent-transactions", dashboardController.getRecentTransactions);

export default router;
