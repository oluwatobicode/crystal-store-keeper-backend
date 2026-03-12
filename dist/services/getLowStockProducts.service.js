"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLowStockProducts = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const Sale_1 = __importDefault(require("../models/Sale"));
const mongoose_1 = __importDefault(require("mongoose"));
const response_1 = require("../utils/response");
const config_1 = require("../config");
const getLowStockProducts = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        // get all low stock products for this business
        const products = await Product_1.default.find({
            $expr: { $lte: ["$currentStock", "$reorderLevel"] },
            isActive: true,
            businessId,
        });
        // date range for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // get sales velocity for all these products in one query
        const salesVelocity = await Sale_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    businessId: new mongoose_1.default.Types.ObjectId(businessId),
                },
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalSold: { $sum: "$items.quantity" },
                },
            },
        ]);
        // map productId → totalSold for quick lookup
        const velocityMap = new Map(salesVelocity.map((s) => [s._id.toString(), s.totalSold]));
        // attach daysLeft and suggestedOrder to each product
        const result = products.map((product) => {
            const totalSold = velocityMap.get(product._id.toString()) ?? 0;
            const avgDailySales = totalSold / 30;
            const daysLeft = avgDailySales > 0
                ? Math.floor(product.currentStock / avgDailySales)
                : null;
            const suggestedOrder = Math.max(0, product.preferredStockLevel - product.currentStock);
            return {
                ...product.toObject(),
                daysLeft,
                suggestedOrder,
            };
        });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Reorder alerts fetched successfully", result);
    }
    catch (error) {
        console.error("Reorder alerts error:", error);
        return next(error);
    }
};
exports.getLowStockProducts = getLowStockProducts;
