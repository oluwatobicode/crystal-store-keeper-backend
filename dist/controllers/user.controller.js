"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.getAllUsers = exports.updateUser = exports.deleteUser = exports.createUser = void 0;
const config_1 = require("../config");
const response_1 = require("../utils/response");
const User_1 = __importDefault(require("../models/User"));
const auditLog_1 = require("../utils/auditLog");
const createUser = async (req, res, next) => {
    try {
        const { fullname, username, password, role, contactNumber } = req.body;
        if (!fullname || !username || !password || !role || !contactNumber) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.USER_MESSAGES.MISSING_FIELDS);
        }
        const existingUser = await User_1.default.findOne({ username });
        if (existingUser) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.USER_MESSAGES.DUPLICATE_USERNAME);
        }
        const newUser = await User_1.default.create({
            ...req.body,
            mustChangePassword: true,
        });
        await (0, auditLog_1.logAudit)(null, "System", "CREATE_USER", `Created User: ${newUser.fullname}`, "users");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, config_1.USER_MESSAGES.CREATED, newUser);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Create user error:", error);
        return next(error);
    }
};
exports.createUser = createUser;
const deleteUser = async (req, res, next) => {
    try {
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Delete user error:", error);
        return next(error);
    }
};
exports.deleteUser = deleteUser;
const updateUser = async (req, res, next) => {
    try {
        const user = await User_1.default.findById(req.params.id).populate("role");
        if (!user) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.USER_MESSAGES.NOT_FOUND);
        }
        const updateUser = await User_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        await (0, auditLog_1.logAudit)(null, "System", "UPDATE_USER", `Updated User: ${updateUser?.fullname}`, "users");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.USER_MESSAGES.UPDATED, updateUser);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Update user error:", error);
        return next(error);
    }
};
exports.updateUser = updateUser;
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User_1.default.find().populate("role");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, users.length > 0 ? config_1.USER_MESSAGES.FETCHED : config_1.USER_MESSAGES.NOT_FOUND, users);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get all users error:", error);
        return next(error);
    }
};
exports.getAllUsers = getAllUsers;
const getUser = async (req, res, next) => {
    try {
        const user = await User_1.default.findById(req.params.id).populate("role");
        if (!user) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.USER_MESSAGES.NOT_FOUND);
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.USER_MESSAGES.FETCHED_ONE, user);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get user error:", error);
        return next(error);
    }
};
exports.getUser = getUser;
