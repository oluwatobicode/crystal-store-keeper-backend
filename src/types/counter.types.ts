import { Types } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
  businessId: Types.ObjectId;
}
