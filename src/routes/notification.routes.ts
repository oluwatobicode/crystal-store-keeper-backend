import { Router } from "express";
import { notificationController } from "../controllers";
import { protectRoutes } from "../middleware/auth.middlware";

const router = Router();

// All routes require authentication
router.use(protectRoutes);

// GET /notifications
router.get("/", notificationController.getNotifications);

// GET /notifications/unread-count
router.get("/unread-count", notificationController.getUnreadCount);

// PATCH /notifications/read-all  ← must come before /:id to avoid route collision
router.patch("/read-all", notificationController.markAllAsRead);

// PATCH /notifications/:id/read
router.patch("/:id/read", notificationController.markAsRead);

// DELETE /notifications  ← clear all
router.delete("/", notificationController.deleteAllNotifications);

// DELETE /notifications/:id
router.delete("/:id", notificationController.deleteNotification);

export default router;
