"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const blacklistSchema = new mongoose_1.default.Schema({
    token: {
        type: String,
        required: true,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});
// TTL index — MongoDB auto-deletes documents once expiresAt passes
blacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Blacklist = mongoose_1.default.model("Blacklist", blacklistSchema);
exports.default = Blacklist;
