"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenBlacklisted = exports.blacklistToken = exports.generateRefreshToken = exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_config_1 = require("../config/app.config");
const AppError_1 = require("./AppError");
const config_1 = require("../config");
const Blacklist_1 = __importDefault(require("../models/Blacklist"));
const signToken = (userId, email, role, permissions, businessId) => {
    return jsonwebtoken_1.default.sign({ userId, email, role, permissions, businessId }, app_config_1.config.jwtSecret, { expiresIn: "7d" });
};
exports.signToken = signToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, app_config_1.config.jwtSecret);
    }
    catch (error) {
        throw new AppError_1.AppError(401, config_1.USER_MESSAGES.INVALID_CREDENTIALS);
    }
};
exports.verifyToken = verifyToken;
const generateRefreshToken = () => { };
exports.generateRefreshToken = generateRefreshToken;
/**
 * Blacklist a JWT so it can no longer be used.
 * The token is stored in the Blacklist collection with its expiry,
 * and MongoDB's TTL index auto-cleans it once expired.
 */
const blacklistToken = async (token) => {
    const decoded = jsonwebtoken_1.default.decode(token);
    if (!decoded || !decoded.exp) {
        throw new AppError_1.AppError(401, config_1.USER_MESSAGES.INVALID_CREDENTIALS);
    }
    const expiresAt = new Date(decoded.exp * 1000);
    await Blacklist_1.default.create({ token, expiresAt });
};
exports.blacklistToken = blacklistToken;
// Check if a token has been blacklisted (i.e. user logged out).
const isTokenBlacklisted = async (token) => {
    const entry = await Blacklist_1.default.findOne({ token });
    return !!entry;
};
exports.isTokenBlacklisted = isTokenBlacklisted;
