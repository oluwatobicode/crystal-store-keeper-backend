"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentTransactions = exports.dashboardAnalysis = void 0;
const response_1 = require("../utils/response");
const config_1 = require("../config");
const Product_1 = __importDefault(require("../models/Product"));
const Sale_1 = __importDefault(require("../models/Sale"));
const mongoose_1 = __importDefault(require("mongoose"));
const dashboardAnalysis = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        // get start and end of today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const todayFilter = {
            createdAt: { $gte: todayStart, $lte: todayEnd },
            businessId: new mongoose_1.default.Types.ObjectId(businessId),
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
            businessId,
        });
        // low stock count
        const lowStockCount = await Product_1.default.countDocuments({
            $expr: { $lte: ["$currentStock", "$reorderLevel"] },
            isActive: true,
            businessId,
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
const getRecentTransactions = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const recentTransactions = await Sale_1.default.find({ businessId })
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
