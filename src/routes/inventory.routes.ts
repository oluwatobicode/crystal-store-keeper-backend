import { Router } from "express";
import { inventoryController } from "../controllers";

const router = Router();

router.post("/receive", inventoryController.receiveStock);
router.post("/adjust", inventoryController.adjustStock);
router.get("/movements", inventoryController.getInventoryMovements);
router.get("/low-stock", inventoryController.getLowStockProducts);

export default router;
