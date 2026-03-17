import mongoose from "mongoose";
import { INotification } from "../types/notification.types";

const notificationModel = new mongoose.Schema<INotification>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["info", "warning", "error", "success"],
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  referenceId: {
    type: String,
    default: null,
  },
});

notificationModel.index({ businessId: 1, userId: 1 });

const Notification = mongoose.model("Notification", notificationModel);
export default Notification;
