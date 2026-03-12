"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });
const botConversationSchema = new mongoose_1.default.Schema({
    businessId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
    },
    chatId: {
        type: Number,
        required: true,
    },
    platform: {
        type: String,
        enum: ["telegram", "whatsapp"],
        default: "telegram",
    },
    messages: {
        type: [messageSchema],
        default: [],
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// one conversation per business per chat — unique combination
botConversationSchema.index({ businessId: 1, chatId: 1 }, { unique: true });
// TTL index — auto-delete conversations older than 24 hours to keep history fresh
botConversationSchema.index({ lastMessageAt: 1 }, { expireAfterSeconds: 86400 });
const BotConversation = mongoose_1.default.model("BotConversation", botConversationSchema);
exports.default = BotConversation;
