import { Router } from "express";
import { recordRepaymentController } from "../controllers";
import { protectRoutes } from "../middleware/auth.middlware";

const router: Router = Router();

router.post(
  "/record-repayment",
  protectRoutes,
  recordRepaymentController.recordRepayment,
);

router.get(
  "/customer/:customerId/credit-history",
  protectRoutes,
  recordRepaymentController.customerCreditHistory,
);

export default router;
