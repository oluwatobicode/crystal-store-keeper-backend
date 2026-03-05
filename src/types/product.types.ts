import { Document, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  brand: string | null;
  location: string | null;
  unit: string;
  SKU: string;
  currentStock: number;
  businessId: Types.ObjectId;
  reorderLevel: number;
  preferredStockLevel: number;
  purchaseCost: number;
  sellingPrice: number;
  supplierId: Types.ObjectId | null;
  isActive: boolean;
}
