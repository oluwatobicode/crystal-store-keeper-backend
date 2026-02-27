"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const settingSchema = new mongoose_1.default.Schema({
    business: {
        storeName: { type: String, default: "" },
        address: { type: String, default: "" },
        phone: { type: String, default: "" },
        email: { type: String, default: "" },
        logoUrl: { type: String, default: null },
    },
    invoice: {
        prefix: { type: String, default: "INV" },
        startingNumber: { type: Number, default: 1 },
        paymentTerms: { type: String, default: "Payment due on receipt" },
        notes: { type: String, default: null },
    },
    system: {
        vatEnabled: { type: Boolean, default: false },
        vatRate: { type: Number, default: 0 },
        currency: { type: String, default: "NGN" },
        sessionTimeoutMinutes: { type: Number, default: 480 },
        managerApprovalDiscountThreshold: { type: Number, default: 15 },
    },
    backup: {
        scheduleEnabled: { type: Boolean, default: false },
        scheduleFrequency: {
            type: String,
            enum: ["daily", "weekly", "monthly", null],
            default: null,
        },
        lastBackupAt: { type: Date, default: null },
    },
}, {
    timestamps: { createdAt: false, updatedAt: true },
});
const Setting = mongoose_1.default.model("Setting", settingSchema);
exports.default = Setting;
