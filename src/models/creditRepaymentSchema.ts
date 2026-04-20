import mongoose from "mongoose";
import { ICreditRepayment } from "../types/creditRepaymentSchema.type";

const creditRepaymentSchema = new mongoose.Schema<ICreditRepayment>(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    salesPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "pos", "bank_transfer"],
      required: true,
    },
    reference: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

creditRepaymentSchema.index({ customerId: 1, businessId: 1 });
creditRepaymentSchema.index({ businessId: 1, createdAt: -1 });

const CreditRepayment = mongoose.model(
  "CreditRepayment",
  creditRepaymentSchema,
);

export default CreditRepayment;
