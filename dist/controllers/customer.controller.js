"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.getCustomerTransactions = exports.updateCustomer = exports.getACustomer = exports.getAllCustomers = exports.createCustomer = void 0;
const Customer_1 = __importDefault(require("../models/Customer"));
const Counter_1 = __importDefault(require("../models/Counter"));
const response_1 = require("../utils/response");
const config_1 = require("../config");
const auditLog_1 = require("../utils/auditLog");
const Sale_1 = __importDefault(require("../models/Sale"));
const generateCustomerId = async (businessId) => {
    const counter = await Counter_1.default.findOneAndUpdate({ _id: `${businessId}-customerId` }, { $inc: { seq: 1 } }, { new: true, upsert: true });
    return `CUST-${String(counter.seq).padStart(4, "0")}`;
};
const createCustomer = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { fullname, phone, customerType } = req.body;
        if (!fullname || !phone || !customerType) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.CUSTOMER_MESSAGES.MISSING_FIELDS);
        }
        // scoped to this business only
        const existingCustomer = await Customer_1.default.findOne({ phone, businessId });
        if (existingCustomer) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.CUSTOMER_MESSAGES.DUPLICATE_PHONE);
        }
        const customerId = await generateCustomerId(businessId);
        const newCustomer = await Customer_1.default.create({
            ...req.body,
            customerId,
            businessId,
        });
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "CREATE_CUSTOMER", `Created customer: ${newCustomer.fullname} (${newCustomer.customerId})`, "customers", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, config_1.CUSTOMER_MESSAGES.CREATED, newCustomer);
    }
    catch (error) {
        console.error("Create customer error:", error);
        return next(error);
    }
};
exports.createCustomer = createCustomer;
const getAllCustomers = async (req, res, next) => {
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
        const customers = await Customer_1.default.find(filter).sort({ createdAt: -1 });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, customers.length > 0 ? config_1.CUSTOMER_MESSAGES.FETCHED : "No customers found", customers);
    }
    catch (error) {
        console.error("Get all customers error:", error);
        return next(error);
    }
};
exports.getAllCustomers = getAllCustomers;
const getACustomer = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        // Run both queries at the same time — no extra round-trip latency
        const [customer, transactions] = await Promise.all([
            Customer_1.default.findOne({ _id: req.params.id, businessId }),
            Sale_1.default.find({ customerId: req.params.id, businessId })
                .select("invoiceId grandTotal amountPaid balanceDue paymentStatus createdAt")
                .sort({ createdAt: -1 })
                .limit(20), // last 20 transactions — enough for a profile view
        ]);
        if (!customer) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.CUSTOMER_MESSAGES.NOT_FOUND);
        }
        // Simplified transaction shape — only what a UI card needs
        const simplifiedTransactions = transactions.map((t) => ({
            invoiceId: t.invoiceId,
            grandTotal: t.grandTotal,
            amountPaid: t.amountPaid,
            balanceDue: t.balanceDue,
            paymentStatus: t.paymentStatus,
            date: t.get("createdAt"),
        }));
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.CUSTOMER_MESSAGES.FETCHED_ONE, {
            customer,
            recentTransactions: simplifiedTransactions,
        });
    }
    catch (error) {
        console.error("Get a customer error:", error);
        return next(error);
    }
};
exports.getACustomer = getACustomer;
const updateCustomer = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const customer = await Customer_1.default.findOne({ _id: req.params.id, businessId });
        if (!customer) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.CUSTOMER_MESSAGES.NOT_FOUND);
        }
        if (req.body.phone && req.body.phone !== customer.phone) {
            const duplicatePhone = await Customer_1.default.findOne({
                phone: req.body.phone,
                businessId,
            });
            if (duplicatePhone) {
                return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.CUSTOMER_MESSAGES.DUPLICATE_PHONE);
            }
        }
        const updatedCustomer = await Customer_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "UPDATE_CUSTOMER", `Updated customer: ${updatedCustomer?.fullname} (${updatedCustomer?.customerId})`, "customers", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.CUSTOMER_MESSAGES.UPDATED, updatedCustomer);
    }
    catch (error) {
        console.error("Update customer error:", error);
        return next(error);
    }
};
exports.updateCustomer = updateCustomer;
const getCustomerTransactions = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const transactions = await Sale_1.default.find({
            customerId: req.params.id,
            businessId,
        });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, transactions.length > 0
            ? config_1.CUSTOMER_MESSAGES.FETCHED
            : "No transactions found", transactions);
    }
    catch (error) {
        console.error("Get customer transactions error:", error);
        return next(error);
    }
};
exports.getCustomerTransactions = getCustomerTransactions;
const deleteCustomer = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const customer = await Customer_1.default.findOne({ _id: req.params.id, businessId });
        if (!customer) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.CUSTOMER_MESSAGES.NOT_FOUND);
        }
        await Customer_1.default.findByIdAndDelete(req.params.id);
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "DELETE_CUSTOMER", `Deleted customer: ${customer.fullname} (${customer.customerId})`, "customers", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.CUSTOMER_MESSAGES.DELETED);
    }
    catch (error) {
        console.error("Delete customer error:", error);
        return next(error);
    }
};
exports.deleteCustomer = deleteCustomer;
