"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
/**
 * Create a notification.
 * - If `referenceId` is supplied (e.g. a productId), the function will UPDATE
 *   an existing unread notification for the same entity instead of inserting a
 *   new one — preventing duplicate alerts for the same product/event.
 * - Without `referenceId`, a fresh notification doc is always inserted.
 */
const createNotification = async (userId, businessId, title, message, type = "info", referenceId) => {
    try {
        if (referenceId) {
            // Upsert: update existing unread notification for this entity, or create one
            await Notification_1.default.findOneAndUpdate({ userId, businessId, referenceId, isRead: false, isDeleted: false }, { title, message, type, isRead: false, referenceId }, { upsert: true, new: true });
        }
        else {
            await Notification_1.default.create({ userId, businessId, title, message, type });
        }
    }
    catch (error) {
        // Fire-and-forget — never crash the main request because a notification failed
        console.error("Failed to create notification:", error);
    }
};
exports.createNotification = createNotification;
