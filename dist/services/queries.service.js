"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingPayments = exports.getCustomerInfo = exports.getPaymentMethodBreakdown = exports.getRecentTransactions = exports.getProductStock = exports.getLowStockProducts = exports.getTopSellingProducts = exports.getSalesByPeriod = exports.getDashboardSummary = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Sale_1 = __importDefault(require("../models/Sale"));
const Product_1 = __importDefault(require("../models/Product"));
const Customer_1 = __importDefault(require("../models/Customer"));
//  DASHBOARD SUMMARY
const getDashboardSummary = async (businessId) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const bId = new mongoose_1.default.Types.ObjectId(businessId);
    const todayFilter = {
        createdAt: { $gte: todayStart, $lte: todayEnd },
        businessId: bId,
    };
    const [todaySalesResult, cashResult, pendingCount, lowStockCount] = await Promise.all([
        Sale_1.default.aggregate([
            { $match: todayFilter },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } },
        ]),
        Sale_1.default.aggregate([
            { $match: todayFilter },
            { $unwind: "$payments" },
            { $match: { "payments.method": "cash" } },
            { $group: { _id: null, cash: { $sum: "$payments.amount" } } },
        ]),
        Sale_1.default.countDocuments({
            paymentStatus: { $in: ["partial", "pending"] },
            businessId,
        }),
        Product_1.default.countDocuments({
            $expr: { $lte: ["$currentStock", "$reorderLevel"] },
            isActive: true,
            businessId,
        }),
    ]);
    return {
        todaySales: todaySalesResult[0]?.total || 0,
        cashInRegister: cashResult[0]?.cash || 0,
        pendingPaymentsCount: pendingCount,
        lowStockCount,
    };
};
exports.getDashboardSummary = getDashboardSummary;
//  SALES BY PERIOD
const getSalesByPeriod = async (businessId, from, to) => {
    const bId = new mongoose_1.default.Types.ObjectId(businessId);
    const filter = {
        businessId: bId,
        createdAt: { $gte: new Date(from), $lte: new Date(to) },
    };
    const [summary, dailyBreakdown] = await Promise.all([
        Sale_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$grandTotal" },
                    totalTransactions: { $sum: 1 },
                    avgTransactionValue: { $avg: "$grandTotal" },
                },
            },
        ]),
        Sale_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSale: { $sum: "$grandTotal" },
                    totalTransactions: { $sum: 1 },
                },
            },
            { $sort: { _id: -1 } },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    totalSale: 1,
                    totalTransactions: 1,
                },
            },
        ]),
    ]);
    return {
        summary: summary[0] || {
            totalRevenue: 0,
            totalTransactions: 0,
            avgTransactionValue: 0,
        },
        dailyBreakdown,
    };
};
exports.getSalesByPeriod = getSalesByPeriod;
//  TOP SELLING PRODUCTS
const getTopSellingProducts = async (businessId, from, to, limit = 10) => {
    const bId = new mongoose_1.default.Types.ObjectId(businessId);
    const result = await Sale_1.default.aggregate([
        {
            $match: {
                businessId: bId,
                createdAt: { $gte: new Date(from), $lte: new Date(to) },
            },
        },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productName",
                totalQuantitySold: { $sum: "$items.quantity" },
                totalRevenue: { $sum: "$items.total" },
            },
        },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: limit },
        {
            $project: {
                _id: 0,
                productName: "$_id",
                totalQuantitySold: 1,
                totalRevenue: 1,
            },
        },
    ]);
    return result;
};
exports.getTopSellingProducts = getTopSellingProducts;
//  LOW STOCK PRODUCTS
const getLowStockProducts = async (businessId) => {
    const products = await Product_1.default.find({
        $expr: { $lte: ["$currentStock", "$reorderLevel"] },
        isActive: true,
        businessId,
    }).select("name currentStock reorderLevel unit preferredStockLevel");
    return products;
};
exports.getLowStockProducts = getLowStockProducts;
//  PRODUCT STOCK
const getProductStock = async (businessId, productName) => {
    const product = await Product_1.default.findOne({
        name: { $regex: productName, $options: "i" },
        businessId,
    }).select("name currentStock unit reorderLevel preferredStockLevel");
    return product || null;
};
exports.getProductStock = getProductStock;
//  RECENT TRANSACTIONS
const getRecentTransactions = async (businessId, limit = 10) => {
    const transactions = await Sale_1.default.find({ businessId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("invoiceId grandTotal paymentStatus customerSnapshot createdAt payments");
    return transactions;
};
exports.getRecentTransactions = getRecentTransactions;
//  PAYMENT METHOD BREAKDOWN
const getPaymentMethodBreakdown = async (businessId, from, to) => {
    const bId = new mongoose_1.default.Types.ObjectId(businessId);
    const result = await Sale_1.default.aggregate([
        {
            $match: {
                businessId: bId,
                createdAt: { $gte: new Date(from), $lte: new Date(to) },
            },
        },
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
    const grandTotal = result.reduce((sum, m) => sum + m.totalAmount, 0);
    return {
        grandTotal,
        breakdown: result.map((m) => ({
            ...m,
            percentage: grandTotal > 0
                ? Math.round((m.totalAmount / grandTotal) * 100 * 100) / 100
                : 0,
        })),
    };
};
exports.getPaymentMethodBreakdown = getPaymentMethodBreakdown;
//  CUSTOMER INFO
const getCustomerInfo = async (businessId, query) => {
    const customer = await Customer_1.default.findOne({
        businessId,
        $or: [{ fullname: { $regex: query, $options: "i" } }, { phone: query }],
    }).select("fullname phone customerType currentBalance totalSpent isActive");
    return customer || null;
};
exports.getCustomerInfo = getCustomerInfo;
//  PENDING PAYMENTS
const getPendingPayments = async (businessId) => {
    const sales = await Sale_1.default.find({
        businessId,
        paymentStatus: { $in: ["partial", "pending"] },
    })
        .sort({ createdAt: -1 })
        .select("invoiceId grandTotal amountPaid paymentStatus customerSnapshot createdAt");
    const totalOwed = sales.reduce((sum, sale) => sum + (sale.grandTotal - sale.amountPaid), 0);
    return { totalOwed, sales };
};
exports.getPendingPayments = getPendingPayments;
