"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const saleItemSchema = new mongoose_1.default.Schema({
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    unitPrice: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
}, { _id: false });
const paymentSchema = new mongoose_1.default.Schema({
    method: {
        type: String,
        enum: ["cash", "pos", "bank_transfer"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    reference: {
        type: String,
        default: null,
    },
}, { _id: false });
const saleSchema = new mongoose_1.default.Schema({
    invoiceId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    salesPersonId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    customerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
    },
    customerSnapshot: {
        name: { type: String, default: "Walk-in Customer" },
        phone: { type: String, default: "" },
    },
    items: {
        type: [saleItemSchema],
        required: true,
        validate: {
            validator: (items) => items.length > 0,
            message: "A sale must have at least one item",
        },
    },
    payments: {
        type: [paymentSchema],
        required: true,
        validate: {
            validator: (payments) => payments.length > 0,
            message: "A sale must have at least one payment",
        },
    },
    subTotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    vatRate: { type: Number, required: true },
    vatAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ["paid", "partial", "pending"],
        required: true,
    },
    notes: { type: String, default: null },
}, {
    timestamps: true,
});
saleSchema.index({ createdAt: -1 });
saleSchema.index({ customerId: 1, createdAt: -1 });
const Sale = mongoose_1.default.model("Sale", saleSchema);
exports.default = Sale;
