import { Types } from "mongoose";
import Notification from "../models/Notification";

type NotificationType = "info" | "warning" | "error" | "success";

/**
 * Create a notification.
 * - If `referenceId` is supplied (e.g. a productId), the function will UPDATE
 *   an existing unread notification for the same entity instead of inserting a
 *   new one — preventing duplicate alerts for the same product/event.
 * - Without `referenceId`, a fresh notification doc is always inserted.
 */
export const createNotification = async (
  userId: Types.ObjectId | string,
  businessId: Types.ObjectId | string,
  title: string,
  message: string,
  type: NotificationType = "info",
  referenceId?: string,
): Promise<void> => {
  try {
    if (referenceId) {
      // Upsert: update existing unread notification for this entity, or create one
      await Notification.findOneAndUpdate(
        { userId, businessId, referenceId, isRead: false, isDeleted: false },
        { title, message, type, isRead: false, referenceId },
        { upsert: true, new: true },
      );
    } else {
      await Notification.create({ userId, businessId, title, message, type });
    }
  } catch (error) {
    // Fire-and-forget — never crash the main request because a notification failed
    console.error("Failed to create notification:", error);
  }
};
