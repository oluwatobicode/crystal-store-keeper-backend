import { Document } from "mongoose";
import { Types } from "mongoose";

export interface Irole {
  _id: string;
  roleName: string;
}

export interface IUser extends Document {
  email: string;
  fullname: string;
  username: string;
  password: string;
  role: Types.ObjectId | Irole;
  businessId: Types.ObjectId;
  contactNumber: string;
  status: "active" | "inactive" | "suspended";
  mustChangePassword: boolean;
  lastLogin: Date | null;
  correctPassword(candidatePassword: string): Promise<boolean>;
}
