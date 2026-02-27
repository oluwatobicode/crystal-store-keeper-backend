"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const auditLogSchema = new mongoose_1.default.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    userSnapshot: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: [
            "sales",
            "inventory",
            "customers",
            "users",
            "settings",
            "auth",
            "backup",
        ],
        required: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
const AuditLog = mongoose_1.default.model("AuditLog", auditLogSchema);
exports.default = AuditLog;
