import mongoose, { Model } from "mongoose";
import { IAdjustment } from "../types/adjustment.types";

const adjustmentSchema = new mongoose.Schema<IAdjustment>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    adjustmentType: {
      type: String,
      enum: [
        "damage",
        "theft",
        "return",
        "correction",
        "initial_count",
        "supplier_return",
      ],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const Adjustment: Model<IAdjustment> = mongoose.model<IAdjustment>(
  "Adjustment",
  adjustmentSchema,
);
export default Adjustment;
