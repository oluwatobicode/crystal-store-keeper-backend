"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplier = exports.updateSupplier = exports.getASupplier = exports.getAllSupplier = exports.createSupplier = void 0;
const response_1 = require("../utils/response");
const config_1 = require("../config");
const Supplier_1 = __importDefault(require("../models/Supplier"));
const auditLog_1 = require("../utils/auditLog");
// this will help in creating a supplier
const createSupplier = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { name, contactPerson, phone, email } = req.body;
        if (!name || !contactPerson || !phone || !email) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.SUPPLIER_MESSAGES.MISSING_FIELDS);
        }
        const newSupplier = await Supplier_1.default.create({ ...req.body, businessId });
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "CREATE_SUPPLIER", `Created supplier: ${newSupplier.name}`, "inventory", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, config_1.SUPPLIER_MESSAGES.CREATED, newSupplier);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Create supplier error:", error);
        return next(error);
    }
};
exports.createSupplier = createSupplier;
const getAllSupplier = async (req, res, next) => {
    const businessId = req.businessId;
    try {
        const { from, to } = req.query;
        const filter = { businessId };
        if (from || to) {
            filter.createdAt = {};
            if (from)
                filter.createdAt.$gte = new Date(from);
            if (to)
                filter.createdAt.$lte = new Date(to);
        }
        const suppliers = await Supplier_1.default.find(filter).sort({ createdAt: -1 });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, suppliers.length > 0 ? config_1.SUPPLIER_MESSAGES.FETCHED : "No suppliers found", suppliers);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get all suppliers error:", error);
        return next(error);
    }
};
exports.getAllSupplier = getAllSupplier;
const getASupplier = async (req, res, next) => {
    const businessId = req.businessId;
    try {
        const supplier = await Supplier_1.default.findOne({ _id: req.params.id, businessId });
        if (!supplier) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.SUPPLIER_MESSAGES.NOT_FOUND);
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUPPLIER_MESSAGES.FETCHED_ONE, supplier);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get a supplier error:", error);
        return next(error);
    }
};
exports.getASupplier = getASupplier;
// this will be used to update a supplier
const updateSupplier = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const supplier = await Supplier_1.default.findOne({ _id: req.params.id, businessId });
        if (!supplier) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.SUPPLIER_MESSAGES.NOT_FOUND);
        }
        const updatedSupplier = await Supplier_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "UPDATE_SUPPLIER", `Updated supplier: ${updatedSupplier?.name}`, "inventory", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUPPLIER_MESSAGES.UPDATED, updatedSupplier);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Update supplier error:", error);
        return next(error);
    }
};
exports.updateSupplier = updateSupplier;
// this will delete a supplier
const deleteSupplier = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const supplier = await Supplier_1.default.findOne({ _id: req.params.id, businessId });
        if (!supplier) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.SUPPLIER_MESSAGES.NOT_FOUND);
        }
        await Supplier_1.default.findByIdAndDelete(req.params.id);
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "DELETE_SUPPLIER", `Deleted supplier: ${supplier.name}`, "inventory", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUPPLIER_MESSAGES.DELETED);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Delete supplier error:", error);
        return next(error);
    }
};
exports.deleteSupplier = deleteSupplier;
