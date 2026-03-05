import mongoose, { Model } from "mongoose";
import { ICounter } from "../types/counter.types";

const counterSchema = new mongoose.Schema<ICounter>({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
});

const Counter: Model<ICounter> = mongoose.model<ICounter>(
  "Counter",
  counterSchema,
);
export default Counter;
