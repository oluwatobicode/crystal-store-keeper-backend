import mongoose from "mongoose";
import Sale from "../models/Sale";
import Product from "../models/Product";
import Customer from "../models/Customer";

//  DASHBOARD SUMMARY

export const getDashboardSummary = async (businessId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const bId = new mongoose.Types.ObjectId(businessId);

  const todayFilter = {
    createdAt: { $gte: todayStart, $lte: todayEnd },
    businessId: bId,
  };

  const [todaySalesResult, cashResult, pendingCount, lowStockCount] =
    await Promise.all([
      Sale.aggregate([
        { $match: todayFilter },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
      Sale.aggregate([
        { $match: todayFilter },
        { $unwind: "$payments" },
        { $match: { "payments.method": "cash" } },
        { $group: { _id: null, cash: { $sum: "$payments.amount" } } },
      ]),
      Sale.countDocuments({
        paymentStatus: { $in: ["partial", "pending"] },
        businessId,
      }),
      Product.countDocuments({
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

//  SALES BY PERIOD

export const getSalesByPeriod = async (
  businessId: string,
  from: string,
  to: string,
) => {
  const bId = new mongoose.Types.ObjectId(businessId);

  const filter = {
    businessId: bId,
    createdAt: { $gte: new Date(from), $lte: new Date(to) },
  };

  const [summary, dailyBreakdown] = await Promise.all([
    Sale.aggregate([
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
    Sale.aggregate([
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

//  TOP SELLING PRODUCTS

export const getTopSellingProducts = async (
  businessId: string,
  from: string,
  to: string,
  limit: number = 10,
) => {
  const bId = new mongoose.Types.ObjectId(businessId);

  const result = await Sale.aggregate([
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

//  LOW STOCK PRODUCTS

export const getLowStockProducts = async (businessId: string) => {
  const products = await Product.find({
    $expr: { $lte: ["$currentStock", "$reorderLevel"] },
    isActive: true,
    businessId,
  }).select("name currentStock reorderLevel unit preferredStockLevel");

  return products;
};

//  PRODUCT STOCK

export const getProductStock = async (
  businessId: string,
  productName: string,
) => {
  const product = await Product.findOne({
    name: { $regex: productName, $options: "i" },
    businessId,
  }).select("name currentStock unit reorderLevel preferredStockLevel");

  return product || null;
};

//  RECENT TRANSACTIONS

export const getRecentTransactions = async (
  businessId: string,
  limit: number = 10,
) => {
  const transactions = await Sale.find({ businessId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "invoiceId grandTotal paymentStatus customerSnapshot createdAt payments",
    );

  return transactions;
};

//  PAYMENT METHOD BREAKDOWN

export const getPaymentMethodBreakdown = async (
  businessId: string,
  from: string,
  to: string,
) => {
  const bId = new mongoose.Types.ObjectId(businessId);

  const result = await Sale.aggregate([
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
      percentage:
        grandTotal > 0
          ? Math.round((m.totalAmount / grandTotal) * 100 * 100) / 100
          : 0,
    })),
  };
};

//  CUSTOMER INFO

export const getCustomerInfo = async (businessId: string, query: string) => {
  const customer = await Customer.findOne({
    businessId,
    $or: [{ fullname: { $regex: query, $options: "i" } }, { phone: query }],
  }).select("fullname phone customerType currentBalance totalSpent isActive");

  return customer || null;
};

//  PENDING PAYMENTS

export const getPendingPayments = async (businessId: string) => {
  const sales = await Sale.find({
    businessId,
    paymentStatus: { $in: ["partial", "pending"] },
  })
    .sort({ createdAt: -1 })
    .select(
      "invoiceId grandTotal amountPaid paymentStatus customerSnapshot createdAt",
    );

  const totalOwed = sales.reduce(
    (sum, sale) => sum + (sale.grandTotal - sale.amountPaid),
    0,
  );

  return { totalOwed, sales };
};
