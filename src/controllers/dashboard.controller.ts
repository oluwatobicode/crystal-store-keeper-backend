import { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/response";
import { ERROR_MESSAGES, HTTP_STATUS } from "../config";
import Product from "../models/Product";
import Sale from "../models/Sale";

export const dashboardAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
    });

    // low stock count
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ["$currentStock", "$reorderLevel"] },
      isActive: true,
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
    const products = await Product.find({
      $expr: {
        $lte: ["$currentStock", "$reorderLevel"],
      },
      isActive: true,
    }).select("name currentStock reorderLevel");

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Reorder alerts fetched successfully",
      products,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
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
    const recentTransactions = await Sale.find()
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
