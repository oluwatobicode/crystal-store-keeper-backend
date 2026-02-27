"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const customerSchema = new mongoose_1.default.Schema({
    customerId: {
        type: String,
        required: true,
        unique: true,
    },
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        default: null,
    },
    phone: {
        type: String,
        required: true,
        index: true,
    },
    address: {
        type: String,
        default: null,
    },
    customerType: {
        type: String,
        enum: ["individual", "business"],
        required: true,
    },
    creditLimit: {
        type: Number,
        default: 0,
    },
    currentBalance: {
        type: Number,
        default: 0,
    },
    totalSpent: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
const Customer = mongoose_1.default.model("Customer", customerSchema);
exports.default = Customer;
