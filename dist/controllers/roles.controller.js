"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRolePermissions = exports.updateRole = exports.getRole = exports.getAllRoles = exports.createRole = void 0;
const response_1 = require("../utils/response");
const config_1 = require("../config");
const Role_1 = __importDefault(require("../models/Role"));
const role_types_1 = require("../types/role.types");
const auditLog_1 = require("../utils/auditLog");
// this is to create a new role
const createRole = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { roleName, description, permissions } = req.body;
        if (!roleName || !description) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.ROLE_MESSAGES.MISSING_FIELDS);
        }
        const existingRole = await Role_1.default.findOne({ roleName, businessId });
        if (existingRole) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.ROLE_MESSAGES.DUPLICATE_NAME);
        }
        // validate that all permissions are valid
        if (permissions && permissions.length > 0) {
            const invalidPermissions = permissions.filter((p) => !role_types_1.ALL_PERMISSIONS.includes(p));
            if (invalidPermissions.length > 0) {
                return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.ROLE_MESSAGES.INVALID_PERMISSIONS);
            }
        }
        const newRole = await Role_1.default.create({ ...req.body, businessId });
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "CREATE_ROLE", `Created role: ${newRole.roleName}`, "users", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, config_1.ROLE_MESSAGES.CREATED, newRole);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Create role error:", error);
        return next(error);
    }
};
exports.createRole = createRole;
// this is to get all roles
const getAllRoles = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { from, to } = req.query;
        const filter = { businessId };
        if (from || to) {
            filter.createdAt = {};
            if (from)
                filter.createdAt.$gte = new Date(from);
            if (to)
                filter.createdAt.$lte = new Date(to);
        }
        const roles = await Role_1.default.find(filter).sort({ createdAt: -1 });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, roles.length > 0 ? config_1.ROLE_MESSAGES.FETCHED : "No roles found", roles);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get all roles error:", error);
        return next(error);
    }
};
exports.getAllRoles = getAllRoles;
// this is to get a single role
const getRole = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const role = await Role_1.default.findOne({ _id: req.params.id, businessId });
        if (!role) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.ROLE_MESSAGES.NOT_FOUND);
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.ROLE_MESSAGES.FETCHED_ONE, role);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get role error:", error);
        return next(error);
    }
};
exports.getRole = getRole;
// this is to update a role
const updateRole = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const role = await Role_1.default.findOne({ _id: req.params.id, businessId });
        if (!role) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.ROLE_MESSAGES.NOT_FOUND);
        }
        // prevent renaming default roles (Admin, Manager, Cashier)
        if (role.isDefault &&
            req.body.roleName &&
            req.body.roleName !== role.roleName) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.ROLE_MESSAGES.CANNOT_MODIFY_DEFAULT);
        }
        // if roleName is being changed, check for duplicates
        if (req.body.roleName && req.body.roleName !== role.roleName) {
            const duplicateName = await Role_1.default.findOne({ roleName: req.body.roleName });
            if (duplicateName) {
                return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.ROLE_MESSAGES.DUPLICATE_NAME);
            }
        }
        // validate permissions if provided
        if (req.body.permissions && req.body.permissions.length > 0) {
            const invalidPermissions = req.body.permissions.filter((p) => !role_types_1.ALL_PERMISSIONS.includes(p));
            if (invalidPermissions.length > 0) {
                return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.ROLE_MESSAGES.INVALID_PERMISSIONS);
            }
        }
        const updatedRole = await Role_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "UPDATE_ROLE", `Updated role: ${updatedRole?.roleName}`, "users", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.ROLE_MESSAGES.UPDATED, updatedRole);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Update role error:", error);
        return next(error);
    }
};
exports.updateRole = updateRole;
// this is to update a role's permissions only
const updateRolePermissions = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const role = await Role_1.default.findOne({ _id: req.params.id, businessId });
        if (!role) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.ROLE_MESSAGES.NOT_FOUND);
        }
        const { permissions } = req.body;
        if (!permissions || !Array.isArray(permissions)) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.ROLE_MESSAGES.INVALID_PERMISSIONS);
        }
        // validate all permissions
        const invalidPermissions = permissions.filter((p) => !role_types_1.ALL_PERMISSIONS.includes(p));
        if (invalidPermissions.length > 0) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.ROLE_MESSAGES.INVALID_PERMISSIONS);
        }
        const updatedRole = await Role_1.default.findByIdAndUpdate(req.params.id, { permissions }, { new: true, runValidators: true });
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "UPDATE_ROLE_PERMISSIONS", `Updated permissions for role: ${updatedRole?.roleName}`, "users", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.ROLE_MESSAGES.UPDATED, updatedRole);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Update role permissions error:", error);
        return next(error);
    }
};
exports.updateRolePermissions = updateRolePermissions;
// this is to delete a role
const deleteRole = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const role = await Role_1.default.findOne({ _id: req.params.id, businessId });
        if (!role) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.ROLE_MESSAGES.NOT_FOUND);
        }
        // prevent deleting default roles (Admin, Manager, Cashier)
        if (role.isDefault) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.ROLE_MESSAGES.CANNOT_DELETE_DEFAULT);
        }
        await Role_1.default.findByIdAndDelete(req.params.id);
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "DELETE_ROLE", `Deleted role: ${role.roleName}`, "users", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.ROLE_MESSAGES.DELETED);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Delete role error:", error);
        return next(error);
    }
};
exports.deleteRole = deleteRole;
