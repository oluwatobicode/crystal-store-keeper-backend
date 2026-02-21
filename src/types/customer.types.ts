import { Document } from "mongoose";

export interface ICustomer extends Document {
  customerId: string;
  fullname: string;
  email: string | null;
  phone: string;
  address: string | null;
  customerType: "individual" | "business";
  creditLimit: number;
  currentBalance: number;
  totalSpent: number;
  isActive: boolean;
}
