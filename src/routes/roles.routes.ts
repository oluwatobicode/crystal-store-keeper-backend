import { Router } from "express";
import { roleController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

router.post(
  "/",
  protectRoutes,
  authorize("user.roles"),
  roleController.createRole,
);
router.get(
  "/",
  protectRoutes,
  authorize("user.roles"),
  roleController.getAllRoles,
);
router.patch(
  "/:id",
  protectRoutes,
  authorize("user.roles"),
  roleController.updateRole,
);
router.delete(
  "/:id",
  protectRoutes,
  authorize("user.roles"),
  roleController.deleteRole,
);

export default router;
