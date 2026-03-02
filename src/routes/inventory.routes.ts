import { Router } from "express";
import { inventoryController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

router.post(
  "/receive",
  protectRoutes,
  authorize("inventory.receive"),
  inventoryController.receiveStock,
);
router.post(
  "/adjust",
  protectRoutes,
  authorize("inventory.adjust"),
  inventoryController.adjustStock,
);
router.get(
  "/movements",
  protectRoutes,
  authorize("inventory.view"),
  inventoryController.getInventoryMovements,
);
router.get(
  "/low-stock",
  protectRoutes,
  authorize("inventory.view"),
  inventoryController.getLowStockProducts,
);

export default router;
