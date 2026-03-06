import { NextFunction, Request, Response } from "express";
import Product from "../models/Product";
import Sale from "../models/Sale";
import mongoose from "mongoose";
import { sendSuccess } from "../utils/response";
import { HTTP_STATUS } from "../config";

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
