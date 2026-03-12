"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportInventory = exports.exportSales = exports.exportCustomers = void 0;
const Customer_1 = __importDefault(require("../models/Customer"));
const Product_1 = __importDefault(require("../models/Product"));
const response_1 = require("../utils/response");
const config_1 = require("../config");
const plainjs_1 = require("@json2csv/plainjs");
const Sale_1 = __importDefault(require("../models/Sale"));
const exportCustomers = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { from, to, category, userId } = req.query;
        const filter = { businessId };
        if (category)
            filter.category = category;
        if (userId)
            filter.userId = userId;
        if (from || to) {
            filter.timestamp = {};
            if (from)
                filter.timestamp.$gte = new Date(from);
            if (to)
                filter.timestamp.$lte = new Date(to);
        }
        const customers = await Customer_1.default.find(filter)
            .sort({ createdAt: -1 })
            .lean();
        if (!customers || customers.length === 0) {
            return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "No customers to export", []);
        }
        const fields = [
            "fullname",
            "email",
            "phone",
            "address",
            "customerType",
            "creditLimit",
            "currentBalance",
            "totalSpent",
        ];
        const opts = { fields };
        const parser = new plainjs_1.Parser(opts);
        const csv = parser.parse(customers);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
        res.status(config_1.HTTP_STATUS.OK).send(csv);
    }
    catch (error) {
        next(error);
    }
};
exports.exportCustomers = exportCustomers;
const exportSales = async (req, res, next) => {
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
        const sales = await Sale_1.default.find(filter)
            .sort({ createdAt: -1 })
            .populate("salesPersonId")
            .lean();
        if (!sales || sales.length === 0) {
            return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "No sales to export", []);
        }
        const fields = [
            { label: "Invoice #", value: "invoiceId" },
            {
                label: "Date",
                value: (row) => new Date(row.createdAt).toLocaleDateString(),
            },
            { label: "Customer", value: "customerSnapshot.name" },
            { label: "Customer Phone", value: "customerSnapshot.phone" },
            { label: "Sub Total", value: "subTotal" },
            { label: "Discount", value: "discountAmount" },
            { label: "VAT Rate", value: "vatRate" },
            { label: "VAT Amount", value: "vatAmount" },
            { label: "Grand Total", value: "grandTotal" },
            { label: "Amount Paid", value: "amountPaid" },
            { label: "Payment Status", value: "paymentStatus" },
            {
                label: "Payment Methods",
                value: (row) => row.payments
                    .map((p) => `${p.method}: ${p.amount}`)
                    .join(", "),
            },
            {
                label: "Items Count",
                value: (row) => row.items.length,
            },
            {
                label: "Items",
                value: (row) => row.items
                    .map((i) => `${i.productName} x${i.quantity}`)
                    .join(", "),
            },
            { label: "Notes", value: "notes" },
        ];
        const opts = { fields };
        const parser = new plainjs_1.Parser(opts);
        const csv = parser.parse(sales);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=sales.csv");
        res.status(config_1.HTTP_STATUS.OK).send(csv);
    }
    catch (error) {
        next(error);
    }
};
exports.exportSales = exportSales;
const exportInventory = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const products = await Product_1.default.find({ businessId })
            .sort({ name: 1 })
            .populate("supplierId")
            .lean();
        if (!products || products.length === 0) {
            return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "No inventory to export", []);
        }
        const fields = [
            { label: "Product Name", value: "name" },
            { label: "SKU", value: "SKU" },
            { label: "Brand", value: "brand" },
            { label: "Unit", value: "unit" },
            { label: "Current Stock", value: "currentStock" },
            { label: "Reorder Level", value: "reorderLevel" },
            { label: "Preferred Stock Level", value: "preferredStockLevel" },
            { label: "Purchase Cost", value: "purchaseCost" },
            { label: "Selling Price", value: "sellingPrice" },
            {
                label: "Profit Margin",
                value: (row) => row.sellingPrice - row.purchaseCost,
            },
            {
                label: "Stock Value",
                value: (row) => row.currentStock * row.purchaseCost,
            },
            { label: "Location", value: "location" },
            {
                label: "Supplier",
                value: (row) => {
                    const supplier = row.supplierId;
                    return supplier ? supplier.name : "N/A";
                },
            },
            {
                label: "Status",
                value: (row) => row.isActive ? "Active" : "Inactive",
            },
        ];
        const opts = { fields };
        const parser = new plainjs_1.Parser(opts);
        const csv = parser.parse(products);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=inventory.csv");
        res.status(config_1.HTTP_STATUS.OK).send(csv);
    }
    catch (error) {
        next(error);
    }
};
exports.exportInventory = exportInventory;
