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
    },
    description: {
      type: String,
      required: true,
    },
    permission: {
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

// unique role name per business, not globally
roleSchema.index({ roleName: 1, businessId: 1 }, { unique: true });

const Role: Model<IRole> = mongoose.model<IRole>("Role", roleSchema);
export default Role;
