"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        default: null,
    },
    location: {
        type: String,
        default: null,
    },
    unit: {
        type: String,
        required: true,
    },
    SKU: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    currentStock: {
        type: Number,
        default: 0,
    },
    reorderLevel: {
        type: Number,
        default: 0,
    },
    preferredStockLevel: {
        type: Number,
        default: 0,
    },
    purchaseCost: {
        type: Number,
        required: true,
    },
    sellingPrice: {
        type: Number,
        required: true,
    },
    supplierId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Supplier",
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
