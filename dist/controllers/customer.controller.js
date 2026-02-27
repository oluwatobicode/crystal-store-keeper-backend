"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.getACustomer = exports.getAllCustomers = exports.createCustomer = void 0;
const Customer_1 = __importDefault(require("../models/Customer"));
const Counter_1 = __importDefault(require("../models/Counter"));
const response_1 = require("../utils/response");
const config_1 = require("../config");
const auditLog_1 = require("../utils/auditLog");
// helper to auto-generate customerId e.g. CUST-0001
const generateCustomerId = async () => {
    const counter = await Counter_1.default.findOneAndUpdate({ _id: "customerId" }, { $inc: { seq: 1 } }, { new: true, upsert: true });
    return `CUST-${String(counter.seq).padStart(4, "0")}`;
};
// create a new customer
const createCustomer = async (req, res, next) => {
    try {
        const { fullname, phone, customerType } = req.body;
        if (!fullname || !phone || !customerType) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.CUSTOMER_MESSAGES.MISSING_FIELDS);
        }
        const existingCustomer = await Customer_1.default.findOne({ phone });
        if (existingCustomer) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.CUSTOMER_MESSAGES.DUPLICATE_PHONE);
        }
        const customerId = await generateCustomerId();
        const newCustomer = await Customer_1.default.create({
            ...req.body,
            customerId,
        });
        await (0, auditLog_1.logAudit)(null, "System", "CREATE_CUSTOMER", `Created customer: ${newCustomer.fullname} (${newCustomer.customerId})`, "customers");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, config_1.CUSTOMER_MESSAGES.CREATED, newCustomer);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Create customer error:", error);
        return next(error);
    }
};
exports.createCustomer = createCustomer;
// this is to get all customers
const getAllCustomers = async (req, res, next) => {
    try {
        const customers = await Customer_1.default.find();
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, customers.length > 0 ? config_1.CUSTOMER_MESSAGES.FETCHED : "No customers found", customers);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get all customers error:", error);
        return next(error);
    }
};
exports.getAllCustomers = getAllCustomers;
// this is to get a single customer
const getACustomer = async (req, res, next) => {
    try {
        const customer = await Customer_1.default.findById(req.params.id);
        if (!customer) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.CUSTOMER_MESSAGES.NOT_FOUND);
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.CUSTOMER_MESSAGES.FETCHED_ONE, customer);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get a customer error:", error);
        return next(error);
    }
};
exports.getACustomer = getACustomer;
// this is to update a customer
const updateCustomer = async (req, res, next) => {
    try {
        const customer = await Customer_1.default.findById(req.params.id);
        if (!customer) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.CUSTOMER_MESSAGES.NOT_FOUND);
        }
        // if phone is being changed, check for duplicates
        if (req.body.phone && req.body.phone !== customer.phone) {
            const duplicatePhone = await Customer_1.default.findOne({ phone: req.body.phone });
            if (duplicatePhone) {
                return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.CUSTOMER_MESSAGES.DUPLICATE_PHONE);
            }
        }
        const updatedCustomer = await Customer_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        await (0, auditLog_1.logAudit)(null, "System", "UPDATE_CUSTOMER", `Updated customer: ${updatedCustomer?.fullname} (${updatedCustomer?.customerId})`, "customers");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.CUSTOMER_MESSAGES.UPDATED, updatedCustomer);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Update customer error:", error);
        return next(error);
    }
};
exports.updateCustomer = updateCustomer;
// delete a customer
const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer_1.default.findById(req.params.id);
        if (!customer) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.CUSTOMER_MESSAGES.NOT_FOUND);
        }
        await Customer_1.default.findByIdAndDelete(req.params.id);
        await (0, auditLog_1.logAudit)(null, "System", "DELETE_CUSTOMER", `Deleted customer: ${customer.fullname} (${customer.customerId})`, "customers");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.CUSTOMER_MESSAGES.DELETED);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Delete customer error:", error);
        return next(error);
    }
};
exports.deleteCustomer = deleteCustomer;
