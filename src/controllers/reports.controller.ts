import { NextFunction, Request, Response } from "express";
import Sale from "../models/Sale";
import StockMovement from "../models/StockManegment";
import { sendSuccess } from "../utils/response";
import { HTTP_STATUS } from "../config";

// getting the sales analysis and report
export const salesAnalysisReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = req.query;

    const filter: Record<string, unknown> = {};

    if (from || to) {
      filter.createdAt = {} as Record<string, Date>;

      if (from) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(
          from as string,
        );
      }

      if (to) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(
          to as string,
        );
      }
    }

    const sale = await Sale.aggregate([
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

    const dailySalesTransactions = await Sale.aggregate([
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

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Sales analysis report generated successfully",
      {
        summary: sale[0] || {
          totalSale: 0,
          totalTransactions: 0,
          averageTransactionsValue: 0,
        },
        dailyBreakdown: dailySalesTransactions,
      },
    );
  } catch (error) {
    console.log(error);
  }
};

// getting all the product analysis and report
export const productAnalysisReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = req.query;

    const filter: Record<string, unknown> = {};

    if (from || to) {
      filter.createdAt = {} as Record<string, Date>;

      if (from) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(
          from as string,
        );
      }

      if (to) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(
          to as string,
        );
      }
    }

    const products = await Sale.aggregate([
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

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Product analysis report generated successfully",
      {
        summary: products[0] || {
          totalQuantitySold: 0,
          totalTransactions: 0,
          totalRevenue: 0,
          avgValue: 0,
        },
        products,
      },
    );
  } catch (error) {
    console.log(error);
  }
};

export const paymentMethodReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = req.query;
    const filter: Record<string, unknown> = {};

    if (from || to) {
      filter.createdAt = {} as Record<string, Date>;

      if (from) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(
          from as string,
        );
      }

      if (to) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(
          to as string,
        );
      }
    }

    const salePaymentMethods = await Sale.aggregate([
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
    const grandTotal = salePaymentMethods.reduce(
      (sum, m) => sum + m.totalAmount,
      0,
    );

    const paymentMethods = salePaymentMethods.map((m) => ({
      ...m,
      percentage:
        grandTotal > 0
          ? Math.round((m.totalAmount / grandTotal) * 100 * 100) / 100
          : 0,
    }));

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Payment method report generated successfully",
      {
        grandTotal,
        paymentMethods,
      },
    );
  } catch (error) {
    console.log(error);
  }
};

export const stockMovementReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = req.query;
    const filter: Record<string, unknown> = {};

    if (from || to) {
      filter.createdAt = {} as Record<string, Date>;

      if (from) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(
          from as string,
        );
      }

      if (to) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(
          to as string,
        );
      }
    }

    // summary by movement type
    const byType = await StockMovement.aggregate([
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
    const byProduct = await StockMovement.aggregate([
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

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Stock movement report generated successfully",
      {
        byType,
        byProduct,
      },
    );
  } catch (error) {
    console.log(error);
  }
};
