import { Document, Types } from "mongoose";

export interface IStockMovement extends Document {
  productId: Types.ObjectId;
  productName: string;
  movementType: "sale" | "receive" | "adjustment" | "return";
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  referenceId: Types.ObjectId | null;
  referenceModel: "Sale" | "Adjustment" | null;
  performedBy: Types.ObjectId;
  notes: string | null;
}
