import { Document, Types } from "mongoose";

export interface ISaleItem {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IPayment {
  method: "cash" | "pos" | "bank_transfer";
  amount: number;
  reference: string | null;
}

export interface ISale extends Document {
  invoiceId: string;
  salesPersonId: Types.ObjectId;
  customerId: Types.ObjectId | null;
  customerSnapshot: {
    name: string;
    phone: string;
  };
  items: ISaleItem[];
  payments: IPayment[];
  subTotal: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  amountPaid: number;
  paymentStatus: "paid" | "partial" | "pending";
  notes: string | null;
}
