"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const mongoose_1 = require("mongoose");
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
/**
 * Log an audit entry for any write operation.
 *
 * @param userId      - The ID of the user performing the action (null if auth not yet wired)
 * @param userSnapshot - Human-readable user identity e.g. 'John Doe (Manager)'
 * @param action      - Action label e.g. 'CREATE_SUPPLIER', 'UPDATE_SUPPLIER', 'DELETE_SUPPLIER'
 * @param details     - Human-readable description of what changed
 * @param category    - One of: 'sales' | 'inventory' | 'customers' | 'users' | 'settings' | 'auth' | 'backup'
 */
const logAudit = async (userId, userSnapshot, action, details, category) => {
    try {
        await AuditLog_1.default.create({
            userId: userId ?? new mongoose_1.Types.ObjectId(),
            userSnapshot: userSnapshot || "System",
            action,
            details,
            category,
        });
    }
    catch (error) {
        // Audit logging should never crash the main request
        console.error("Audit log error:", error);
    }
};
exports.logAudit = logAudit;
