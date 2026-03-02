import { Router } from "express";
import { reportController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

router.get(
  "/sales-analysis",
  protectRoutes,
  authorize("reports.view"),
  reportController.salesAnalysisReport,
);
router.get(
  "/product-analysis",
  protectRoutes,
  authorize("reports.view"),
  reportController.productAnalysisReport,
);
router.get(
  "/payment-method",
  protectRoutes,
  authorize("reports.view"),
  reportController.paymentMethodReport,
);
router.get(
  "/stock-movement",
  protectRoutes,
  authorize("reports.view"),
  reportController.stockMovementReports,
);

export default router;
