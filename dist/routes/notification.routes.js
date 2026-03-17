"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_middlware_1 = require("../middleware/auth.middlware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middlware_1.protectRoutes);
// GET /notifications
router.get("/", controllers_1.notificationController.getNotifications);
// GET /notifications/unread-count
router.get("/unread-count", controllers_1.notificationController.getUnreadCount);
// PATCH /notifications/read-all  ← must come before /:id to avoid route collision
router.patch("/read-all", controllers_1.notificationController.markAllAsRead);
// PATCH /notifications/:id/read
router.patch("/:id/read", controllers_1.notificationController.markAsRead);
// DELETE /notifications  ← clear all
router.delete("/", controllers_1.notificationController.deleteAllNotifications);
// DELETE /notifications/:id
router.delete("/:id", controllers_1.notificationController.deleteNotification);
exports.default = router;
