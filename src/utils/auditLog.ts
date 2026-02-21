import { Types } from "mongoose";
import AuditLog from "../models/AuditLog";
import { IAuditLog } from "../types/auditLog.types";

/**
 * Log an audit entry for any write operation.
 *
 * @param userId      - The ID of the user performing the action (null if auth not yet wired)
 * @param userSnapshot - Human-readable user identity e.g. 'John Doe (Manager)'
 * @param action      - Action label e.g. 'CREATE_SUPPLIER', 'UPDATE_SUPPLIER', 'DELETE_SUPPLIER'
 * @param details     - Human-readable description of what changed
 * @param category    - One of: 'sales' | 'inventory' | 'customers' | 'users' | 'settings' | 'auth' | 'backup'
 */
export const logAudit = async (
  userId: Types.ObjectId | string | null,
  userSnapshot: string,
  action: string,
  details: string,
  category: IAuditLog["category"],
): Promise<void> => {
  try {
    await AuditLog.create({
      userId: userId ?? new Types.ObjectId(),
      userSnapshot: userSnapshot || "System",
      action,
      details,
      category,
    });
  } catch (error) {
    // Audit logging should never crash the main request
    console.error("Audit log error:", error);
  }
};
