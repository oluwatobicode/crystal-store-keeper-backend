"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockMovementReports = exports.paymentMethodReport = exports.productAnalysisReport = exports.salesAnalysisReport = void 0;
const Sale_1 = __importDefault(require("../models/Sale"));
const StockManegment_1 = __importDefault(require("../models/StockManegment"));
const response_1 = require("../utils/response");
const config_1 = require("../config");
// getting the sales analysis and report
const salesAnalysisReport = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const filter = {};
        if (from || to) {
            filter.createdAt = {};
            if (from) {
                filter.createdAt.$gte = new Date(from);
            }
            if (to) {
                filter.createdAt.$lte = new Date(to);
            }
        }
        const sale = await Sale_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalSale: { $sum: "$grandTotal" },
                    totalTransactions: { $sum: 1 },
                    averageTransactionsValue: { $avg: "$grandTotal" },
                },
            },
        ]);
        const dailySalesTransactions = await Sale_1.default.aggregate([
            // first match the filter
            { $match: filter },
            // group by day
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSale: { $sum: "$grandTotal" },
                    totalTransactions: { $sum: 1 },
                    averageTransactionsValue: { $avg: "$grandTotal" },
                },
            },
            // sort by date (newest first)
            { $sort: { _id: -1 } },
            // rename _id to date for cleaner response
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    totalSale: 1,
                    totalTransactions: 1,
                    averageTransactionsValue: 1,
                },
            },
        ]);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Sales analysis report generated successfully", {
            summary: sale[0] || {
                totalSale: 0,
                totalTransactions: 0,
                averageTransactionsValue: 0,
            },
            dailyBreakdown: dailySalesTransactions,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Sales analysis report error:", error);
        return next(error);
    }
};
exports.salesAnalysisReport = salesAnalysisReport;
// getting all the product analysis and report
const productAnalysisReport = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const filter = {};
        if (from || to) {
            filter.createdAt = {};
            if (from) {
                filter.createdAt.$gte = new Date(from);
            }
            if (to) {
                filter.createdAt.$lte = new Date(to);
            }
        }
        const products = await Sale_1.default.aggregate([
            { $match: filter },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    productName: {
                        $first: "$items.productName",
                    },
                    totalQuantitySold: {
                        $sum: "$items.quantity",
                    },
                    totalTransactions: {
                        $sum: 1,
                    },
                    totalRevenue: {
                        $sum: "$items.total",
                    },
                    avgValue: {
                        $avg: "$items.total",
                    },
                },
            },
            // sort by total quantity sold
            { $sort: { totalQuantitySold: -1 } },
            {
                $project: {
                    _id: 0,
                    productName: 1,
                    totalQuantitySold: 1,
                    totalTransactions: 1,
                    totalRevenue: 1,
                    avgValue: 1,
                },
            },
        ]);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Product analysis report generated successfully", {
            summary: products[0] || {
                totalQuantitySold: 0,
                totalTransactions: 0,
                totalRevenue: 0,
                avgValue: 0,
            },
            products,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Product analysis report error:", error);
        return next(error);
    }
};
exports.productAnalysisReport = productAnalysisReport;
const paymentMethodReport = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const filter = {};
        if (from || to) {
            filter.createdAt = {};
            if (from) {
                filter.createdAt.$gte = new Date(from);
            }
            if (to) {
                filter.createdAt.$lte = new Date(to);
            }
        }
        const salePaymentMethods = await Sale_1.default.aggregate([
            { $match: filter },
            { $unwind: "$payments" },
            {
                $group: {
                    _id: "$payments.method",
                    totalAmount: { $sum: "$payments.amount" },
                    totalTransactions: { $sum: 1 },
                },
            },
            { $sort: { totalAmount: -1 } },
            {
                $project: {
                    _id: 0,
                    method: "$_id",
                    totalAmount: 1,
                    totalTransactions: 1,
                },
            },
        ]);
        // calculate grand total and add percentage to each method
        const grandTotal = salePaymentMethods.reduce((sum, m) => sum + m.totalAmount, 0);
        const paymentMethods = salePaymentMethods.map((m) => ({
            ...m,
            percentage: grandTotal > 0
                ? Math.round((m.totalAmount / grandTotal) * 100 * 100) / 100
                : 0,
        }));
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Payment method report generated successfully", {
            grandTotal,
            paymentMethods,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Payment method report error:", error);
        return next(error);
    }
};
exports.paymentMethodReport = paymentMethodReport;
const stockMovementReports = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const filter = {};
        if (from || to) {
            filter.createdAt = {};
            if (from) {
                filter.createdAt.$gte = new Date(from);
            }
            if (to) {
                filter.createdAt.$lte = new Date(to);
            }
        }
        // summary by movement type
        const byType = await StockManegment_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$movementType",
                    totalMovements: { $sum: 1 },
                    totalQuantityChange: { $sum: "$quantityChange" },
                },
            },
            { $sort: { totalMovements: -1 } },
            {
                $project: {
                    _id: 0,
                    movementType: "$_id",
                    totalMovements: 1,
                    totalQuantityChange: 1,
                },
            },
        ]);
        // breakdown by product
        const byProduct = await StockManegment_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$productId",
                    productName: { $first: "$productName" },
                    totalMovements: { $sum: 1 },
                    totalReceived: {
                        $sum: {
                            $cond: [{ $gt: ["$quantityChange", 0] }, "$quantityChange", 0],
                        },
                    },
                    totalDeducted: {
                        $sum: {
                            $cond: [{ $lt: ["$quantityChange", 0] }, "$quantityChange", 0],
                        },
                    },
                    netChange: { $sum: "$quantityChange" },
                },
            },
            { $sort: { totalMovements: -1 } },
            {
                $project: {
                    _id: 0,
                    productName: 1,
                    totalMovements: 1,
                    totalReceived: 1,
                    totalDeducted: 1,
                    netChange: 1,
                },
            },
        ]);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Stock movement report generated successfully", {
            byType,
            byProduct,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Stock movement reports error:", error);
        return next(error);
    }
};
exports.stockMovementReports = stockMovementReports;
