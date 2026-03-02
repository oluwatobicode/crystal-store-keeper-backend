import { Router } from "express";
import { productController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

router.post(
  "/",
  protectRoutes,
  authorize("inventory.manage"),
  productController.createProduct,
);
router.get("/", protectRoutes, productController.getAllProducts);
router.get("/:id", protectRoutes, productController.getProductById);
router.patch(
  "/:id",
  protectRoutes,
  authorize("inventory.manage"),
  productController.updateProduct,
);
router.delete(
  "/:id",
  protectRoutes,
  authorize("inventory.manage"),
  productController.deleteProduct,
);

export default router;
