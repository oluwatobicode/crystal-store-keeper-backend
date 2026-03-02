import { Router } from "express";
import { userController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";

const router = Router();

// router.post(
//   "/",
//   protectRoutes,
//   authorize("users.manage"),
//   userController.createUser,
// );

router.post("/", userController.createUser);

router.get(
  "/",
  protectRoutes,
  authorize("users.manage"),
  userController.getAllUsers,
);
router.delete(
  "/:id",
  protectRoutes,
  authorize("users.manage"),
  userController.deleteUser,
);
router.patch(
  "/:id",
  protectRoutes,
  authorize("users.manage"),
  userController.updateUser,
);
router.get(
  "/:id",
  protectRoutes,
  authorize("users.manage"),
  userController.getUser,
);

export default router;
