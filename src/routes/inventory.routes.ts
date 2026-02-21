import { Router } from "express";
import { inventoryController } from "../controllers";

const router = Router();

router.post("/receive", inventoryController.receiveStock);
router.post("/adjust", inventoryController.adjustStock);

export default router;
