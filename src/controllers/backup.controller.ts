import { NextFunction, Request, Response } from "express";
import Customer from "../models/Customer";
import Product from "../models/Product";
import { sendSuccess } from "../utils/response";
import { HTTP_STATUS } from "../config";
import { Parser } from "@json2csv/plainjs";
import Sale from "../models/Sale";

export const exportCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const { from, to, category, userId } = req.query;
    const filter: Record<string, unknown> = { businessId };

    if (category) filter.category = category;
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.timestamp = {} as Record<string, Date>;
      if (from)
        (filter.timestamp as Record<string, Date>).$gte = new Date(
          from as string,
        );
      if (to)
        (filter.timestamp as Record<string, Date>).$lte = new Date(
          to as string,
        );
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    if (!customers || customers.length === 0) {
      return sendSuccess(res, HTTP_STATUS.OK, "No customers to export", []);
    }

    const fields = [
      "fullname",
      "email",
      "phone",
      "address",
      "customerType",
      "creditLimit",
      "currentBalance",
      "totalSpent",
    ];
    const opts = { fields };

    const parser = new Parser(opts);
    const csv = parser.parse(customers);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
    res.status(HTTP_STATUS.OK).send(csv);
  } catch (error) {
    next(error);
  }
};

export const exportSales = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const { from, to } = req.query;
    const filter: Record<string, unknown> = { businessId };

    if (from || to) {
      filter.createdAt = {} as Record<string, Date>;
      if (from)
        (filter.createdAt as Record<string, Date>).$gte = new Date(
          from as string,
        );
      if (to)
        (filter.createdAt as Record<string, Date>).$lte = new Date(
          to as string,
        );
    }

    const sales = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .populate("salesPersonId")
      .lean();

    if (!sales || sales.length === 0) {
      return sendSuccess(res, HTTP_STATUS.OK, "No sales to export", []);
    }

    const fields = [
      { label: "Invoice #", value: "invoiceId" },
      {
        label: "Date",
        value: (row: Record<string, unknown>) =>
          new Date(row.createdAt as string).toLocaleDateString(),
      },
      { label: "Customer", value: "customerSnapshot.name" },
      { label: "Customer Phone", value: "customerSnapshot.phone" },
      { label: "Sub Total", value: "subTotal" },
      { label: "Discount", value: "discountAmount" },
      { label: "VAT Rate", value: "vatRate" },
      { label: "VAT Amount", value: "vatAmount" },
      { label: "Grand Total", value: "grandTotal" },
      { label: "Amount Paid", value: "amountPaid" },
      { label: "Payment Status", value: "paymentStatus" },
      {
        label: "Payment Methods",
        value: (row: Record<string, unknown>) =>
          (row.payments as Array<{ method: string; amount: number }>)
            .map((p) => `${p.method}: ${p.amount}`)
            .join(", "),
      },
      {
        label: "Items Count",
        value: (row: Record<string, unknown>) =>
          (row.items as Array<unknown>).length,
      },
      {
        label: "Items",
        value: (row: Record<string, unknown>) =>
          (row.items as Array<{ productName: string; quantity: number }>)
            .map((i) => `${i.productName} x${i.quantity}`)
            .join(", "),
      },
      { label: "Notes", value: "notes" },
    ];
    const opts = { fields };

    const parser = new Parser(opts);
    const csv = parser.parse(sales);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=sales.csv");
    res.status(HTTP_STATUS.OK).send(csv);
  } catch (error) {
    next(error);
  }
};

export const exportInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const products = await Product.find({ businessId })
      .sort({ name: 1 })
      .populate("supplierId")
      .lean();

    if (!products || products.length === 0) {
      return sendSuccess(res, HTTP_STATUS.OK, "No inventory to export", []);
    }

    const fields = [
      { label: "Product Name", value: "name" },
      { label: "SKU", value: "SKU" },
      { label: "Brand", value: "brand" },
      { label: "Unit", value: "unit" },
      { label: "Current Stock", value: "currentStock" },
      { label: "Reorder Level", value: "reorderLevel" },
      { label: "Preferred Stock Level", value: "preferredStockLevel" },
      { label: "Purchase Cost", value: "purchaseCost" },
      { label: "Selling Price", value: "sellingPrice" },
      {
        label: "Profit Margin",
        value: (row: Record<string, unknown>) =>
          (row.sellingPrice as number) - (row.purchaseCost as number),
      },
      {
        label: "Stock Value",
        value: (row: Record<string, unknown>) =>
          (row.currentStock as number) * (row.purchaseCost as number),
      },
      { label: "Location", value: "location" },
      {
        label: "Supplier",
        value: (row: Record<string, unknown>) => {
          const supplier = row.supplierId as Record<string, unknown> | null;
          return supplier ? (supplier.name as string) : "N/A";
        },
      },
      {
        label: "Status",
        value: (row: Record<string, unknown>) =>
          (row.isActive as boolean) ? "Active" : "Inactive",
      },
    ];
    const opts = { fields };

    const parser = new Parser(opts);
    const csv = parser.parse(products);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=inventory.csv");
    res.status(HTTP_STATUS.OK).send(csv);
  } catch (error) {
    next(error);
  }
};
