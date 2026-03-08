import { Document, Types } from "mongoose";

export interface ISetting extends Document {
  businessId: Types.ObjectId;
  business: {
    storeName: string;
    address: string;
    phone: string;
    email: string;
    logoUrl: string | null;
  };
  invoice: {
    prefix: string;
    startingNumber: number;
    paymentTerms: string;
    notes: string | null;
  };
  system: {
    vatEnabled: boolean;
    vatRate: number;
    currency: string;
    sessionTimeoutMinutes: number;
    managerApprovalDiscountThreshold: number;
  };
  telegram: {
    connected: boolean;
    chatId: number | null;
    connectCode: string | null;
    connectedAt: Date | null;
  };
  backup: {
    scheduleEnabled: boolean;
    scheduleFrequency: "daily" | "weekly" | "monthly" | null;
    lastBackupAt: Date | null;
  };
}
