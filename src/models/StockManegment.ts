import mongoose, { Model } from "mongoose";
import { IStockMovement } from "../types/stockMovement.types";

const stockMovementSchema = new mongoose.Schema<IStockMovement>(
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
    movementType: {
      type: String,
      enum: ["sale", "receive", "adjustment", "return"],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
      default: null,
    },
    referenceModel: {
      type: String,
      enum: ["Sale", "Adjustment", null],
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

stockMovementSchema.index({ productId: 1, createdAt: -1 });

const StockMovement: Model<IStockMovement> = mongoose.model<IStockMovement>(
  "StockMovement",
  stockMovementSchema,
);
export default StockMovement;
