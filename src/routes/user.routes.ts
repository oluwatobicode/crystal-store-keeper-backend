import { Router } from "express";
import { userController, authController } from "../controllers";
import { protectRoutes, authorize } from "../middleware/auth.middlware";
import { uploadImage } from "../middleware/upload.middleware";

const router = Router();

// GET /me — get own profile
router.get("/me", protectRoutes, userController.getMe);

// PATCH /me — update own name / contact number
router.patch("/me", protectRoutes, userController.updateMe);

// PATCH /me/password — change own password (requires current password)
router.patch("/me/password", protectRoutes, authController.changePassword);

// PATCH /me/avatar — upload own profile picture
router.patch(
  "/me/avatar",
  protectRoutes,
  uploadImage.single("avatar"),
  userController.uploadOwnAvatar,
);

// ─── /:id — Admin routes (requires users.manage permission)

router.post(
  "/",
  protectRoutes,
  authorize("users.manage"),
  userController.createUser,
);

router.get(
  "/",
  protectRoutes,
  authorize("users.manage"),
  userController.getAllUsers,
);

router.get(
  "/:id",
  protectRoutes,
  authorize("users.manage"),
  userController.getUser,
);

router.patch(
  "/:id",
  protectRoutes,
  authorize("users.manage"),
  userController.updateUser,
);

router.patch(
  "/:id/status",
  protectRoutes,
  authorize("users.manage"),
  userController.updateUserStatus,
);

router.patch(
  "/:id/avatar",
  protectRoutes,
  authorize("users.manage"),
  uploadImage.single("avatar"),
  userController.uploadAvatar,
);

router.delete(
  "/:id",
  protectRoutes,
  authorize("users.manage"),
  userController.deleteUser,
);

export default router;
