import mongoose, { Model } from "mongoose";
import { ISale, ISaleItem, IPayment } from "../types/sale.types";

const saleItemSchema = new mongoose.Schema<ISaleItem>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    method: {
      type: String,
      enum: ["cash", "pos", "bank_transfer"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const saleSchema = new mongoose.Schema<ISale>(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    salesPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    customerSnapshot: {
      name: { type: String, default: "Walk-in Customer" },
      phone: { type: String, default: "" },
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (items: ISaleItem[]) => items.length > 0,
        message: "A sale must have at least one item",
      },
    },
    payments: {
      type: [paymentSchema],
      required: true,
      validate: {
        validator: (payments: IPayment[]) => payments.length > 0,
        message: "A sale must have at least one payment",
      },
    },
    subTotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    vatRate: { type: Number, required: true },
    vatAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "pending"],
      required: true,
    },
    notes: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

saleSchema.index({ createdAt: -1 });
saleSchema.index({ customerId: 1, createdAt: -1 });

const Sale: Model<ISale> = mongoose.model<ISale>("Sale", saleSchema);
export default Sale;
