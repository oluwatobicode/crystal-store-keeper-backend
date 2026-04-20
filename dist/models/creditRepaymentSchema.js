"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const creditRepaymentSchema = new mongoose_1.default.Schema({
    customerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
    },
    businessId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
    },
    salesPersonId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "pos", "bank_transfer"],
        required: true,
    },
    reference: {
        type: String,
        default: null,
    },
    note: {
        type: String,
        default: null,
    },
}, { timestamps: true });
creditRepaymentSchema.index({ customerId: 1, businessId: 1 });
creditRepaymentSchema.index({ businessId: 1, createdAt: -1 });
const CreditRepayment = mongoose_1.default.model("CreditRepayment", creditRepaymentSchema);
exports.default = CreditRepayment;
