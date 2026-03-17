"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_middlware_1 = require("../middleware/auth.middlware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// GET /me — get own profile
router.get("/me", auth_middlware_1.protectRoutes, controllers_1.userController.getMe);
// PATCH /me — update own name / contact number
router.patch("/me", auth_middlware_1.protectRoutes, controllers_1.userController.updateMe);
// PATCH /me/password — change own password (requires current password)
router.patch("/me/password", auth_middlware_1.protectRoutes, controllers_1.authController.changePassword);
// PATCH /me/avatar — upload own profile picture
router.patch("/me/avatar", auth_middlware_1.protectRoutes, upload_middleware_1.uploadImage.single("avatar"), controllers_1.userController.uploadOwnAvatar);
// ─── /:id — Admin routes (requires users.manage permission)
router.post("/", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("users.manage"), controllers_1.userController.createUser);
router.get("/", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("users.manage"), controllers_1.userController.getAllUsers);
router.get("/:id", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("users.manage"), controllers_1.userController.getUser);
router.patch("/:id", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("users.manage"), controllers_1.userController.updateUser);
router.patch("/:id/status", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("users.manage"), controllers_1.userController.updateUserStatus);
router.patch("/:id/avatar", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("users.manage"), upload_middleware_1.uploadImage.single("avatar"), controllers_1.userController.uploadAvatar);
router.delete("/:id", auth_middlware_1.protectRoutes, (0, auth_middlware_1.authorize)("users.manage"), controllers_1.userController.deleteUser);
exports.default = router;
