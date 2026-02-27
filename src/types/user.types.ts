import { Document } from "mongoose";
import { Types } from "mongoose";

export interface IUser extends Document {
  email: string;
  fullname: string;
  username: string;
  password: string;
  role: Types.ObjectId;
  contactNumber: string;
  status: "active" | "inactive" | "suspended";
  mustChangePassword: boolean;
  lastLogin: Date | null;
  correctPassword(candidatePassword: string): Promise<boolean>;
}
