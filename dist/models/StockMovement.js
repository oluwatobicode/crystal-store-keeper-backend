"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const stockMovementSchema = new mongoose_1.default.Schema({
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    businessId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
    },
    movementType: {
        type: String,
        enum: ["sale", "receive", "adjustment", "return"],
        required: true,
    },
    quantityChange: {
        type: Number,
        required: true,
    },
    stockBefore: {
        type: Number,
        required: true,
    },
    stockAfter: {
        type: Number,
        required: true,
    },
    referenceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        refPath: "referenceModel",
        default: null,
    },
    referenceModel: {
        type: String,
        enum: ["Sale", "Adjustment", null],
        default: null,
    },
    performedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    notes: {
        type: String,
        default: null,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
stockMovementSchema.index({ businessId: 1, productId: 1, createdAt: -1 });
stockMovementSchema.index({ businessId: 1, createdAt: -1 });
stockMovementSchema.index({ businessId: 1, movementType: 1, createdAt: -1 });
const StockMovement = mongoose_1.default.model("StockMovement", stockMovementSchema);
exports.default = StockMovement;
