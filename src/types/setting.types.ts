import { Document } from "mongoose";

export interface ISetting extends Document {
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
  backup: {
    scheduleEnabled: boolean;
    scheduleFrequency: "daily" | "weekly" | "monthly" | null;
    lastBackupAt: Date | null;
  };
}
