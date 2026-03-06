import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { HTTP_STATUS } from "../config";
import Product from "../models/Product";
import Sale from "../models/Sale";
import mongoose from "mongoose";

export const dashboardAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    // get start and end of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayFilter = {
      createdAt: { $gte: todayStart, $lte: todayEnd },
      businessId: new mongoose.Types.ObjectId(businessId),
    };

    // today's total sales
    const todaySalesResult = await Sale.aggregate([
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
    const cashResult = await Sale.aggregate([
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
    const pendingPaymentsCount = await Sale.countDocuments({
      paymentStatus: { $in: ["partial", "pending"] },
      businessId,
    });

    // low stock count
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ["$currentStock", "$reorderLevel"] },
      isActive: true,
      businessId,
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Dashboard summary fetched successfully",
      {
        todaySales,
        cashInRegister,
        pendingPaymentsCount,
        lowStockCount,
      },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Dashboard analysis error:", error);
    return next(error);
  }
};

export const getLowStockProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    // get all low stock products for this business
    const products = await Product.find({
      $expr: { $lte: ["$currentStock", "$reorderLevel"] },
      isActive: true,
      businessId,
    });

    // date range for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // get sales velocity for all these products in one query
    const salesVelocity = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          businessId: new mongoose.Types.ObjectId(businessId),
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
    const velocityMap = new Map(
      salesVelocity.map((s) => [s._id.toString(), s.totalSold]),
    );

    // attach daysLeft and suggestedOrder to each product
    const result = products.map((product) => {
      const totalSold = velocityMap.get(product._id.toString()) ?? 0;
      const avgDailySales = totalSold / 30;

      const daysLeft =
        avgDailySales > 0
          ? Math.floor(product.currentStock / avgDailySales)
          : null;

      const suggestedOrder = Math.max(
        0,
        product.preferredStockLevel - product.currentStock,
      );

      return {
        ...product.toObject(),
        daysLeft,
        suggestedOrder,
      };
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Reorder alerts fetched successfully",
      result,
    );
  } catch (error) {
    console.error("Reorder alerts error:", error);
    return next(error);
  }
};

export const getRecentTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
    const recentTransactions = await Sale.find({ businessId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("invoiceId grandTotal paymentStatus createdAt customerSnapshot")
      .populate("customerId", "fullname phone");

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Recent transactions fetched successfully",
      recentTransactions,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Recent transactions error:", error);
    return next(error);
  }
};
