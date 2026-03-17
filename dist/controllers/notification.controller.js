"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const config_1 = require("../config");
const response_1 = require("../utils/response");
const Notification_1 = __importDefault(require("../models/Notification"));
// GET /notifications — fetch all non-deleted notifications for the current user
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const businessId = req.businessId;
        const notifications = await Notification_1.default.find({
            userId,
            businessId,
            isDeleted: false,
        }).sort({ createdAt: -1 });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, notifications.length > 0 ? "Notifications fetched" : "No notifications", notifications);
    }
    catch (error) {
        return next(error);
    }
};
exports.getNotifications = getNotifications;
// GET /notifications/unread-count — lightweight count badge for the UI
const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const businessId = req.businessId;
        const count = await Notification_1.default.countDocuments({
            userId,
            businessId,
            isRead: false,
            isDeleted: false,
        });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Unread count fetched", { count });
    }
    catch (error) {
        return next(error);
    }
};
exports.getUnreadCount = getUnreadCount;
// PATCH /notifications/:id/read — mark one notification as read
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const businessId = req.businessId;
        const notification = await Notification_1.default.findOneAndUpdate({ _id: req.params.id, userId, businessId, isDeleted: false }, { isRead: true }, { new: true });
        if (!notification) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, "Notification not found");
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Notification marked as read", notification);
    }
    catch (error) {
        return next(error);
    }
};
exports.markAsRead = markAsRead;
// PATCH /notifications/read-all — mark every unread notification as read
const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const businessId = req.businessId;
        await Notification_1.default.updateMany({ userId, businessId, isRead: false, isDeleted: false }, { isRead: true });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "All notifications marked as read", null);
    }
    catch (error) {
        return next(error);
    }
};
exports.markAllAsRead = markAllAsRead;
// DELETE /notifications/:id — soft-delete a single notification
const deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const businessId = req.businessId;
        const notification = await Notification_1.default.findOneAndUpdate({ _id: req.params.id, userId, businessId }, { isDeleted: true }, { new: true });
        if (!notification) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, "Notification not found");
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Notification deleted", null);
    }
    catch (error) {
        return next(error);
    }
};
exports.deleteNotification = deleteNotification;
// DELETE /notifications — soft-delete ALL notifications for the user
const deleteAllNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const businessId = req.businessId;
        await Notification_1.default.updateMany({ userId, businessId }, { isDeleted: true });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "All notifications cleared", null);
    }
    catch (error) {
        return next(error);
    }
};
exports.deleteAllNotifications = deleteAllNotifications;
