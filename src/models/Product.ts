import mongoose, { Model } from "mongoose";
import { IProduct } from "../types/product.types";

const productSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      default: null,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    location: {
      type: String,
      default: null,
    },
    unit: {
      type: String,
      required: true,
    },
    SKU: {
      type: String,
      required: true,
      uppercase: true,
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 0,
    },
    preferredStockLevel: {
      type: Number,
      default: 0,
    },
    purchaseCost: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
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

// SKU must be unique per business, not globally
productSchema.index({ SKU: 1, businessId: 1 }, { unique: true });
productSchema.index({ businessId: 1 });

const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  productSchema,
);
export default Product;
