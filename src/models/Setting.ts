import mongoose, { Model } from "mongoose";
import { ISetting } from "../types/setting.types";

const settingSchema = new mongoose.Schema<ISetting>(
  {
    business: {
      storeName: { type: String, default: "" },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      logoUrl: { type: String, default: null },
    },
    invoice: {
      prefix: { type: String, default: "INV" },
      startingNumber: { type: Number, default: 1 },
      paymentTerms: { type: String, default: "Payment due on receipt" },
      notes: { type: String, default: null },
    },
    system: {
      vatEnabled: { type: Boolean, default: false },
      vatRate: { type: Number, default: 0 },
      currency: { type: String, default: "NGN" },
      sessionTimeoutMinutes: { type: Number, default: 480 },
      managerApprovalDiscountThreshold: { type: Number, default: 15 },
    },
    backup: {
      scheduleEnabled: { type: Boolean, default: false },
      scheduleFrequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", null],
        default: null,
      },
      lastBackupAt: { type: Date, default: null },
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  },
);

const Setting: Model<ISetting> = mongoose.model<ISetting>(
  "Setting",
  settingSchema,
);
export default Setting;
