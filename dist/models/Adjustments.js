"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const adjustmentSchema = new mongoose_1.default.Schema({
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    adjustmentType: {
        type: String,
        enum: [
            "damage",
            "theft",
            "return",
            "correction",
            "initial_count",
            "supplier_return",
        ],
        required: true,
    },
    quantityChange: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    performedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
const Adjustment = mongoose_1.default.model("Adjustment", adjustmentSchema);
exports.default = Adjustment;
