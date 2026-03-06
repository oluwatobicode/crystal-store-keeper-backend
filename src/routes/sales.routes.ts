import { Router } from "express";
import {
  createSale,
  getAllSales,
  getASale,
  getSaleInvoice,
} from "../controllers/sales.controller";
import { authorize, protectRoutes } from "../middleware/auth.middlware";

const router = Router();

router.post("/", protectRoutes, authorize("pos.operate"), createSale);
router.get("/", protectRoutes, authorize("pos.operate"), getAllSales);
router.get("/:id", protectRoutes, authorize("pos.operate"), getASale);

router.get(
  "/:id/invoice",
  protectRoutes,
  authorize("pos.operate"),
  getSaleInvoice,
);

export default router;
