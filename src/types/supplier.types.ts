import { Document, Types } from "mongoose";

export interface ISupplier extends Document {
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  businessId: Types.ObjectId;
}
