"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMe = exports.getMe = exports.uploadOwnAvatar = exports.uploadAvatar = exports.getUser = exports.getAllUsers = exports.updateUserStatus = exports.updateUser = exports.deleteUser = exports.createUser = void 0;
const config_1 = require("../config");
const response_1 = require("../utils/response");
const User_1 = __importDefault(require("../models/User"));
const Business_1 = __importDefault(require("../models/Business"));
const auditLog_1 = require("../utils/auditLog");
const email_1 = require("../utils/email");
const app_config_1 = require("../config/app.config");
const cloudinary_1 = require("../utils/cloudinary");
const createUser = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { fullname, username, password, role, contactNumber } = req.body;
        if (!fullname || !username || !password || !role || !contactNumber) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.USER_MESSAGES.MISSING_FIELDS);
        }
        // scoped — check duplicate username within this business only
        const existingUser = await User_1.default.findOne({ username, businessId });
        if (existingUser) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.USER_MESSAGES.DUPLICATE_USERNAME);
        }
        const newUser = await User_1.default.create({
            ...req.body,
            businessId,
            mustChangePassword: true,
            isVerified: true,
        });
        await (0, auditLog_1.logAudit)(req.user._id, req.user.fullname, "CREATE_USER", `Created user: ${newUser.fullname}`, "users", businessId);
        // Send invitation email to the newly created user
        try {
            const business = await Business_1.default.findById(businessId);
            const loginUrl = `${app_config_1.config.frontendUrl}/login`;
            await (0, email_1.inviteUserEmail)(newUser.email, newUser.fullname, req.user.fullname, business?.businessName ?? "Crystal Store Keeper", loginUrl);
        }
        catch (emailError) {
            console.error("Failed to send invite email:", emailError);
            // Non-blocking — user is already created, don't fail the request
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, config_1.USER_MESSAGES.CREATED, newUser);
    }
    catch (error) {
        console.error("Create user error:", error);
        return next(error);
    }
};
exports.createUser = createUser;
const deleteUser = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const user = await User_1.default.findOne({ _id: req.params.id, businessId });
        if (!user) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.USER_MESSAGES.NOT_FOUND);
        }
        await User_1.default.findByIdAndDelete(req.params.id);
        await (0, auditLog_1.logAudit)(req.user._id, req.user.fullname, "DELETE_USER", `Deleted user: ${user.fullname}`, "users", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.USER_MESSAGES.DELETED);
    }
    catch (error) {
        console.error("Delete user error:", error);
        return next(error);
    }
};
exports.deleteUser = deleteUser;
const updateUser = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const user = await User_1.default.findOne({ _id: req.params.id, businessId });
        if (!user) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.USER_MESSAGES.NOT_FOUND);
        }
        const updatedUser = await User_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        await (0, auditLog_1.logAudit)(req.user._id, req.user.fullname, "UPDATE_USER", `Updated user: ${updatedUser?.fullname}`, "users", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.USER_MESSAGES.UPDATED, updatedUser);
    }
    catch (error) {
        console.error("Update user error:", error);
        return next(error);
    }
};
exports.updateUser = updateUser;
const updateUserStatus = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { status } = req.body;
        if (!status || !["active", "inactive", "suspended"].includes(status)) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, "Invalid status value");
        }
        const user = await User_1.default.findOne({ _id: req.params.id, businessId });
        if (!user) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.USER_MESSAGES.NOT_FOUND);
        }
        const updatedUser = await User_1.default.findByIdAndUpdate(req.params.id, { status }, { new: true });
        await (0, auditLog_1.logAudit)(req.user._id, req.user.fullname, "UPDATE_USER_STATUS", `Updated user status: ${user.fullname} → ${status}`, "users", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.USER_MESSAGES.UPDATED, updatedUser);
    }
    catch (error) {
        console.error("Update user status error:", error);
        return next(error);
    }
};
exports.updateUserStatus = updateUserStatus;
const getAllUsers = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const users = await User_1.default.find({ businessId })
            .populate("role")
            .sort({ createdAt: -1 });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, users.length > 0 ? config_1.USER_MESSAGES.FETCHED : "No users found", users);
    }
    catch (error) {
        console.error("Get all users error:", error);
        return next(error);
    }
};
exports.getAllUsers = getAllUsers;
const getUser = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const user = await User_1.default.findOne({
            _id: req.params.id,
            businessId,
        }).populate("role");
        if (!user) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.USER_MESSAGES.NOT_FOUND);
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.USER_MESSAGES.FETCHED_ONE, user);
    }
    catch (error) {
        console.error("Get user error:", error);
        return next(error);
    }
};
exports.getUser = getUser;
const uploadAvatar = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { id } = req.params;
        const user = await User_1.default.findOne({ _id: id, businessId });
        if (!user) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.USER_MESSAGES.NOT_FOUND);
        }
        if (!req.file) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, "No image file provided");
        }
        const result = await (0, cloudinary_1.uploadProfilePicture)(req.file.buffer, id, businessId.toString());
        user.avatarUrl = result.secure_url;
        await user.save();
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Avatar updated successfully", {
            avatarUrl: user.avatarUrl,
        });
    }
    catch (error) {
        console.error("Upload avatar error:", error);
        return next(error);
    }
};
exports.uploadAvatar = uploadAvatar;
// Self-service: logged-in user uploads their own profile picture
const uploadOwnAvatar = async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        const businessId = req.businessId;
        const user = await User_1.default.findOne({ _id: userId, businessId });
        if (!user) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.USER_MESSAGES.NOT_FOUND);
        }
        if (!req.file) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, "No image file provided");
        }
        const result = await (0, cloudinary_1.uploadProfilePicture)(req.file.buffer, userId, businessId.toString());
        user.avatarUrl = result.secure_url;
        await user.save();
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Avatar updated successfully", {
            avatarUrl: user.avatarUrl,
        });
    }
    catch (error) {
        console.error("Upload own avatar error:", error);
        return next(error);
    }
};
exports.uploadOwnAvatar = uploadOwnAvatar;
// GET /me — return the logged-in user's own profile
const getMe = async (req, res, next) => {
    try {
        const user = await User_1.default.findById(req.user._id).populate("role");
        if (!user) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.USER_MESSAGES.NOT_FOUND);
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Profile fetched successfully", {
            fullName: user.fullname,
            contactNumber: user.contactNumber,
            avatarUrl: user.avatarUrl,
            status: user.status,
            role: user.role,
            _id: user._id,
        });
    }
    catch (error) {
        console.error("Get me error:", error);
        return next(error);
    }
};
exports.getMe = getMe;
// PATCH /me — update own profile (name + contact only — no role/status changes)
const updateMe = async (req, res, next) => {
    try {
        // whitelist only safe fields — users cannot elevate their own role, status etc.
        const { fullname, contactNumber } = req.body;
        if (!fullname && !contactNumber) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, "Provide at least one field to update (fullname or contactNumber)");
        }
        const allowedUpdates = {};
        if (fullname)
            allowedUpdates.fullname = fullname;
        if (contactNumber)
            allowedUpdates.contactNumber = contactNumber;
        const updatedUser = await User_1.default.findByIdAndUpdate(req.user._id, allowedUpdates, { new: true, runValidators: true }).populate("role");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Profile updated successfully", updatedUser);
    }
    catch (error) {
        console.error("Update me error:", error);
        return next(error);
    }
};
exports.updateMe = updateMe;
