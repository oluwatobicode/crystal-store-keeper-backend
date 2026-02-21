import { Router } from "express";
import { supplierController } from "../controllers";

const router = Router();

router.post("/", supplierController.createSupplier);
router.get("/", supplierController.getAllSupplier);
router.get("/:id", supplierController.getASupplier);
router.put("/:id", supplierController.updateSupplier);
router.delete("/:id", supplierController.deleteSupplier);

export default router;
