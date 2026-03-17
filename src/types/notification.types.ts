import { Types } from "mongoose";

export type INotification = {
  userId: Types.ObjectId;
  businessId: Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  isRead: boolean;
  isDeleted: boolean;
  referenceId?: string;
};
