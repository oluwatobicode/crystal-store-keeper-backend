import { Router } from "express";
import { customerController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

router.post(
  "/",
  protectRoutes,
  authorize("customers.manage"),
  customerController.createCustomer,
);
router.get(
  "/",
  protectRoutes,
  authorize("customers.view"),
  customerController.getAllCustomers,
);
router.get(
  "/:id",
  protectRoutes,
  authorize("customers.view"),
  customerController.getACustomer,
);
router.patch(
  "/:id",
  protectRoutes,
  authorize("customers.manage"),
  customerController.updateCustomer,
);
router.delete(
  "/:id",
  protectRoutes,
  authorize("customers.manage"),
  customerController.deleteCustomer,
);

export default router;
