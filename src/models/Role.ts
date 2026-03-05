import mongoose, { Model } from "mongoose";
import { IRole, ALL_PERMISSIONS } from "../types/role.types";

const roleSchema = new mongoose.Schema<IRole>(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    roleName: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS,
      default: [],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Role: Model<IRole> = mongoose.model<IRole>("Role", roleSchema);
export default Role;
