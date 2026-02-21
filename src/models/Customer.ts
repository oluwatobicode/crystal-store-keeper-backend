import mongoose, { Model } from "mongoose";
import { ICustomer } from "../types/customer.types";

const customerSchema = new mongoose.Schema<ICustomer>(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    address: {
      type: String,
      default: null,
    },
    customerType: {
      type: String,
      enum: ["individual", "business"],
      required: true,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Customer: Model<ICustomer> = mongoose.model<ICustomer>(
  "Customer",
  customerSchema,
);
export default Customer;
