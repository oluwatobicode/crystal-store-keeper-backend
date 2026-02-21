import { Document, Types } from "mongoose";

export interface IAdjustment extends Document {
  productId: Types.ObjectId;
  adjustmentType:
    | "damage"
    | "theft"
    | "return"
    | "correction"
    | "initial_count"
    | "supplier_return";
  quantityChange: number;
  reason: string;
  performedBy: Types.ObjectId;
}
