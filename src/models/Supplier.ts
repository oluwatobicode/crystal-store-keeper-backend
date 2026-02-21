import mongoose, { Model } from "mongoose";
import { ISupplier } from "../types/supplier.types";

const supplierSchema = new mongoose.Schema<ISupplier>(
  {
    name: {
      type: String,
      required: true,
    },
    contactPerson: {
      type: String,
      required: true,
      default: null,
    },
    phone: {
      type: String,
      required: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Supplier: Model<ISupplier> = mongoose.model<ISupplier>(
  "Supplier",
  supplierSchema,
);
export default Supplier;
