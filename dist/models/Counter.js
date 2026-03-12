"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const counterSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        required: true,
    },
    seq: {
        type: Number,
        default: 0,
    },
    businessId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
    },
});
const Counter = mongoose_1.default.model("Counter", counterSchema);
exports.default = Counter;
