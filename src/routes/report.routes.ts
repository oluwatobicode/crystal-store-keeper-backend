import Router from "express";
import { reportController } from "../controllers";

const router = Router();

router.get("/sales-analysis", reportController.salesAnalysisReport);
router.get("/product-analysis", reportController.productAnalysisReport);
router.get("/payment-method", reportController.paymentMethodReport);
router.get("/stock-movement", reportController.stockMovementReports);

export default router;
