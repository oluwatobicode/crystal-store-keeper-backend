"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
    fullname: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Role",
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        default: "active",
    },
    mustChangePassword: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
userSchema.pre("save", async function () {
    if (!this.isModified("password"))
        return;
    const salt = await bcryptjs_1.default.genSalt(12);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
});
userSchema.methods.correctPassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
