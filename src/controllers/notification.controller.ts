import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../config";
import { sendError, sendSuccess } from "../utils/response";
import Notification from "../models/Notification";

// GET /notifications — fetch all non-deleted notifications for the current user
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!._id;
    const businessId = req.businessId!;

    const notifications = await Notification.find({
      userId,
      businessId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      notifications.length > 0 ? "Notifications fetched" : "No notifications",
      notifications,
    );
  } catch (error) {
    return next(error);
  }
};

// GET /notifications/unread-count — lightweight count badge for the UI
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!._id;
    const businessId = req.businessId!;

    const count = await Notification.countDocuments({
      userId,
      businessId,
      isRead: false,
      isDeleted: false,
    });

    return sendSuccess(res, HTTP_STATUS.OK, "Unread count fetched", { count });
  } catch (error) {
    return next(error);
  }
};

// PATCH /notifications/:id/read — mark one notification as read
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!._id;
    const businessId = req.businessId!;

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId, businessId, isDeleted: false },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Notification not found");
    }

    return sendSuccess(res, HTTP_STATUS.OK, "Notification marked as read", notification);
  } catch (error) {
    return next(error);
  }
};

// PATCH /notifications/read-all — mark every unread notification as read
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!._id;
    const businessId = req.businessId!;

    await Notification.updateMany(
      { userId, businessId, isRead: false, isDeleted: false },
      { isRead: true },
    );

    return sendSuccess(res, HTTP_STATUS.OK, "All notifications marked as read", null);
  } catch (error) {
    return next(error);
  }
};

// DELETE /notifications/:id — soft-delete a single notification
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!._id;
    const businessId = req.businessId!;

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId, businessId },
      { isDeleted: true },
      { new: true },
    );

    if (!notification) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Notification not found");
    }

    return sendSuccess(res, HTTP_STATUS.OK, "Notification deleted", null);
  } catch (error) {
    return next(error);
  }
};

// DELETE /notifications — soft-delete ALL notifications for the user
export const deleteAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!._id;
    const businessId = req.businessId!;

    await Notification.updateMany({ userId, businessId }, { isDeleted: true });

    return sendSuccess(res, HTTP_STATUS.OK, "All notifications cleared", null);
  } catch (error) {
    return next(error);
  }
};
