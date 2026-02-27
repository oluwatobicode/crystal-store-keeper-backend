"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const role_types_1 = require("../types/role.types");
const roleSchema = new mongoose_1.default.Schema({
    roleName: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    permissions: {
        type: [String],
        enum: role_types_1.ALL_PERMISSIONS,
        default: [],
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
const Role = mongoose_1.default.model("Role", roleSchema);
exports.default = Role;
