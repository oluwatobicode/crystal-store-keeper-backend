import { Document } from "mongoose";

export const ALL_PERMISSIONS = [
  // dashboard view
  "dashboard.view",

  // point of scale roles
  "pos.operate",
  "pos.discount.small",
  "pos.discount.large",
  "pos.refund",

  // customer roles
  "customers.view",
  "customers.manage",
  "customer.history",

  // transactions & payments roles
  "transactions.view",
  "transactions.view.one",
  "transactions.reconcile",
  "transactions.mange.payments",

  // inventory roles
  "inventory.view",
  "inventory.receive",
  "inventory.adjust",
  "inventory.manage",

  // report & analytics roles
  "reports.view",
  "reports.export",
  "reports.profit",

  // user managmet roles
  "users.manage",
  "user.roles",
  "user.activity",

  // system setting roles
  "settings.manage",
  "audit.view",
  "backup.manage",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export interface IRole extends Document {
  roleName: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
}
