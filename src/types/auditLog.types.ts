import { Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  timestamp: Date;
  userId: Types.ObjectId;
  userSnapshot: string;
  action: string;
  businessId: Types.ObjectId;
  details: string;
  category:
    | "sales"
    | "inventory"
    | "customers"
    | "users"
    | "settings"
    | "auth"
    | "backup"
    | "credit";
}
