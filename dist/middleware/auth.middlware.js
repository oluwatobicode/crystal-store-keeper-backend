"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protectRoutes = void 0;
const AppError_1 = require("../utils/AppError");
const config_1 = require("../config");
const token_1 = require("../utils/token");
const User_1 = __importDefault(require("../models/User"));
const protectRoutes = async (req, res, next) => {
    try {
        // 1. Get token from headers
        const token = req.headers.authorization;
        // 2. Check if token exists
        if (!token || !token.startsWith("Bearer ")) {
            throw new AppError_1.AppError(401, config_1.USER_MESSAGES.INVALID_CREDENTIALS);
        }
        const rawToken = token.split(" ")[1];
        // 3. Check if token has been blacklisted (user logged out)
        if (await (0, token_1.isTokenBlacklisted)(rawToken)) {
            throw new AppError_1.AppError(401, "Token has been invalidated, please log in again");
        }
        // 4. Verify token
        const decodedToken = (0, token_1.verifyToken)(rawToken);
        // 5. Check if user exists
        const user = await User_1.default.findById(decodedToken.userId).populate("role");
        // 6. Check if user is valid
        if (!user) {
            throw new AppError_1.AppError(401, config_1.USER_MESSAGES.NOT_FOUND);
        }
        // 7. Attach user to request
        req.user = user;
        req.businessId = decodedToken.businessId;
        // 8. Move to next middleware
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.protectRoutes = protectRoutes;
// factory function — returns a middleware that checks for a specific permission
const authorize = (permission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError_1.AppError(401, config_1.ERROR_MESSAGES.NOT_LOGGED_IN);
            }
            // role is populated by protectRoutes, cast it to IRole to access permissions
            const role = req.user.role;
            if (!role.permission.includes(permission)) {
                throw new AppError_1.AppError(403, "You do not have permission to perform this action");
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
