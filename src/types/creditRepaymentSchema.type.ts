import { Document, Types } from "mongoose";

export interface ICreditRepayment extends Document {
  customerId: Types.ObjectId;
  businessId: Types.ObjectId;
  salesPersonId: Types.ObjectId;
  amount: number;
  paymentMethod: "cash" | "pos" | "bank_transfer";
  reference: string | null;
  note: string | null;
}
