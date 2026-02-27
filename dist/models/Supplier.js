"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const supplierSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    contactPerson: {
        type: String,
        required: true,
        default: null,
    },
    phone: {
        type: String,
        required: true,
        default: null,
    },
    email: {
        type: String,
        required: true,
        default: null,
    },
    address: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});
const Supplier = mongoose_1.default.model("Supplier", supplierSchema);
exports.default = Supplier;
