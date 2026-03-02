import { Router } from "express";
import { supplierController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

router.post(
  "/",
  protectRoutes,
  authorize("inventory.manage"),
  supplierController.createSupplier,
);
router.get("/", protectRoutes, supplierController.getAllSupplier);
router.get("/:id", protectRoutes, supplierController.getASupplier);
router.put(
  "/:id",
  protectRoutes,
  authorize("inventory.manage"),
  supplierController.updateSupplier,
);
router.delete(
  "/:id",
  protectRoutes,
  authorize("inventory.manage"),
  supplierController.deleteSupplier,
);

export default router;
