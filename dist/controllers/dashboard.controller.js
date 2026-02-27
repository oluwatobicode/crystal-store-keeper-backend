"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentTransactions = exports.getLowStockProducts = exports.dashboardAnalysis = void 0;
const response_1 = require("../utils/response");
const config_1 = require("../config");
const Product_1 = __importDefault(require("../models/Product"));
const Sale_1 = __importDefault(require("../models/Sale"));
const dashboardAnalysis = async (req, res, next) => {
    try {
        // get start and end of today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const todayFilter = {
            createdAt: { $gte: todayStart, $lte: todayEnd },
        };
        // today's total sales
        const todaySalesResult = await Sale_1.default.aggregate([
            { $match: todayFilter },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$grandTotal" },
                },
            },
        ]);
        const todaySales = todaySalesResult[0]?.totalSales || 0;
        // cash in register — sum of all cash payments today only
        const cashResult = await Sale_1.default.aggregate([
            { $match: todayFilter },
            { $unwind: "$payments" },
            { $match: { "payments.method": "cash" } },
            {
                $group: {
                    _id: null,
                    cashInRegister: { $sum: "$payments.amount" },
                },
            },
        ]);
        const cashInRegister = cashResult[0]?.cashInRegister || 0;
        // pending payments count
        const pendingPaymentsCount = await Sale_1.default.countDocuments({
            paymentStatus: { $in: ["partial", "pending"] },
        });
        // low stock count
        const lowStockCount = await Product_1.default.countDocuments({
            $expr: { $lte: ["$currentStock", "$reorderLevel"] },
            isActive: true,
        });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Dashboard summary fetched successfully", {
            todaySales,
            cashInRegister,
            pendingPaymentsCount,
            lowStockCount,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Dashboard analysis error:", error);
        return next(error);
    }
};
exports.dashboardAnalysis = dashboardAnalysis;
const getLowStockProducts = async (req, res, next) => {
    try {
        const products = await Product_1.default.find({
            $expr: {
                $lte: ["$currentStock", "$reorderLevel"],
            },
            isActive: true,
        }).select("name currentStock reorderLevel");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Reorder alerts fetched successfully", products);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Reorder alerts error:", error);
        return next(error);
    }
};
exports.getLowStockProducts = getLowStockProducts;
const getRecentTransactions = async (req, res, next) => {
    try {
        const recentTransactions = await Sale_1.default.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select("invoiceId grandTotal paymentStatus createdAt customerSnapshot")
            .populate("customerId", "fullname phone");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Recent transactions fetched successfully", recentTransactions);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Recent transactions error:", error);
        return next(error);
    }
};
exports.getRecentTransactions = getRecentTransactions;
