import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../config";
import { sendError, sendSuccess } from "../utils/response";
import mongoose from "mongoose";
import Sale from "../models/Sale";
import Product from "../models/Product";
import StockMovement from "../models/StockMovement";
import Customer from "../models/Customer";
import Counter from "../models/Counter";
import Setting from "../models/Setting";
import { IPayment } from "../types/sale.types";
import { logAudit } from "../utils/auditLog";
import { createNotification } from "../utils/notification";

export const createSale = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let session: mongoose.ClientSession | undefined;

  try {
    const businessId = req.businessId!;

    // credit feature

    // 1. Validate the request body
    const { items, payments, customerId, discountAmount, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Items are required");
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Payments are required");
    }

    // 2. Start a Mongoose session & transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // 3. Fetch business settings (needed for invoice prefix + VAT)
    const settings = await Setting.findOne({ businessId }).session(session);
    if (!settings) {
      await session.abortTransaction();
      session.endSession();
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Business settings not found",
      );
    }

    // 4. Generate invoice ID atomically via Counter collection
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = settings.invoice.prefix || "INV";
    const counterKey = `invoice-${dateStr}-${businessId}`;

    const counter = await Counter.findOneAndUpdate(
      { _id: counterKey, businessId },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after", session },
    );

    const invoiceId = `${prefix}-${dateStr}-${String(counter!.seq).padStart(4, "0")}`;

    // 5. Look up & validate every product (within the session)
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        businessId,
      }).session(session);

      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return sendError(
          res,
          HTTP_STATUS.NOT_FOUND,
          `Product ${item.productId} not found`,
        );
      }

      if (product.currentStock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          `Insufficient stock for ${product.name}. Available: ${product.currentStock}`,
        );
      }

      // 6. Deduct stock
      const stockBefore = product.currentStock;
      product.currentStock -= item.quantity;
      await product.save({ session });

      // 6b. Fire low-stock notification if stock hits or falls below reorder level (fire-and-forget)
      if (product.currentStock <= product.reorderLevel) {
        createNotification(
          req.user!._id,
          businessId,
          "⚠️ Low Stock Alert",
          `"${product.name}" is running low — only ${product.currentStock} ${product.unit}(s) left (reorder level: ${product.reorderLevel}).`,
          "warning",
          product._id.toString(),
        ).catch(console.error);
      }

      validatedItems.push({
        productId: product._id,
        productName: product.name,
        businessId,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        total: product.sellingPrice * item.quantity,
        stockBefore,
        stockAfter: product.currentStock,
      });
    }

    // 7. Calculate the money
    let subTotal = 0;
    validatedItems.forEach((item) => {
      subTotal += item.unitPrice * item.quantity;
    });

    // VAT is read from settings — never trust the client
    const vatRate = settings.system.vatEnabled
      ? settings.system.vatRate / 100
      : 0;
    const vatAmount = (subTotal - (discountAmount || 0)) * vatRate;
    const grandTotal = subTotal - (discountAmount || 0) + vatAmount;

    // after step 7 extract amount
    const creditPayment = payments.find(
      (payment: IPayment) => payment.method === "credit",
    );

    const creditAmount = creditPayment ? creditPayment.amount : 0;

    const nonCreditAmount = payments
      .filter((payment: IPayment) => payment.method !== "credit")
      .reduce((sum: number, payment: IPayment) => sum + payment.amount, 0);

    let amountPaid = nonCreditAmount;
    // payments.forEach((payment: IPayment) => {
    //   amountPaid += payment.amount;
    // });

    // Walk-in customer cannot buy on credit
    if (creditAmount > 0 && !customerId) {
      await session.abortTransaction();
      session.endSession();
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        "Credit sales require a registered customer",
      );
    }

    if (creditAmount > 0 && customerId) {
      const customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, HTTP_STATUS.NOT_FOUND, "Customer not found");
      }
      if (creditAmount + customer.currentBalance > customer.creditLimit) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, HTTP_STATUS.BAD_REQUEST, "Credit limit exceeded");
      }
    }

    // 8. Validate split payments: sum must equal grandTotal
    const totalPayments = nonCreditAmount + creditAmount;
    if (Math.abs(totalPayments - grandTotal) > 0.01) {
      await session.abortTransaction();
      session.endSession();
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        `Payment total (${totalPayments}) does not match grand total (${grandTotal})`,
      );
    }

    const paymentStatus: "paid" | "partial" | "pending" =
      amountPaid >= grandTotal
        ? "paid"
        : amountPaid > 0
          ? "partial"
          : "pending";

    // 9. Fetch customer snapshot (if provided)
    let customerSnapshot = { name: "Walk-in Customer", phone: "" };
    if (customerId) {
      const customer = await Customer.findById(customerId).session(session);

      if (customer) {
        customerSnapshot = {
          name: customer.fullname,
          phone: customer.phone || "",
        };
      }
    }

    // 10. Create the sale
    const [sale] = await Sale.create(
      [
        {
          invoiceId,
          salesPersonId: req.user!._id,
          customerId: customerId || null,
          customerSnapshot,
          items: validatedItems,
          payments,
          subTotal,
          discountAmount: discountAmount || 0,
          vatRate: vatRate || 0,
          vatAmount,
          grandTotal,
          amountPaid,
          paymentStatus,
          businessId,
          notes: notes || null,
          balanceDue: grandTotal - nonCreditAmount,
          creditDueDate:
            creditAmount > 0 ? req.body.creditDueDate || null : null,
        },
      ],
      { session },
    );

    // 11. Create StockMovement records for each item
    for (const item of validatedItems) {
      await StockMovement.create(
        [
          {
            productId: item.productId,
            productName: item.productName,
            businessId,
            movementType: "sale",
            quantityChange: -item.quantity,
            stockBefore: item.stockBefore,
            stockAfter: item.stockAfter,
            referenceId: sale._id,
            referenceModel: "Sale",
            performedBy: req.user!._id,
            notes: `Sold ${item.quantity} units via ${invoiceId}`,
          },
        ],
        { session },
      );
    }

    // 12. Update customer balance & totalSpent (if a customer is linked)
    if (customerId) {
      const owedAmount = grandTotal - amountPaid;
      const updateFields: Record<string, number> = {
        totalSpent: nonCreditAmount,
      };
      if (owedAmount > 0) {
        updateFields.currentBalance = creditAmount;
      }
      await Customer.findByIdAndUpdate(
        customerId,
        { $inc: updateFields },
        { session },
      );
    }

    // 13. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 14. Audit log (outside transaction — non-critical)
    await logAudit(
      req.user!._id,
      `${req.user!.fullname}`,
      "CREATE_SALE",
      `Created sale ${invoiceId} — ${validatedItems.length} item(s), total: ${grandTotal}`,
      "sales",
      businessId,
    );

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      "Sale created successfully",
      sale,
    );
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("Create sale error:", error);
    return next(error);
  }
};

export const getAllSales = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
    const { from, to, paymentStatus, customerId } = req.query;

    const filter: Record<string, unknown> = { businessId };

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (customerId) filter.customerId = customerId;

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
      .populate("customerId", "fullname phone")
      .populate("salesPersonId", "fullname");

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      sales.length > 0 ? "Sales fetched successfully" : "No sales found",
      sales,
    );
  } catch (error) {
    console.error("Get all sales error:", error);
    return next(error);
  }
};

export const getASale = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
    const { id } = req.params;

    const sale = await Sale.findOne({ _id: id, businessId })
      .populate("customerId", "fullname phone email")
      .populate("salesPersonId", "fullname");

    if (!sale) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Sale not found");
    }

    return sendSuccess(res, HTTP_STATUS.OK, "Sale fetched successfully", sale);
  } catch (error) {
    console.error("Get a sale error:", error);
    return next(error);
  }
};

export const getSaleInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
    const { id } = req.params;

    const sale = await Sale.findOne({ _id: id, businessId })
      .populate("customerId", "fullname phone email address")
      .populate("salesPersonId", "fullname");

    if (!sale) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Sale not found");
    }

    // return the sale data structured for invoice rendering
    return sendSuccess(res, HTTP_STATUS.OK, "Invoice fetched successfully", {
      invoiceId: sale.invoiceId,
      date: (sale as any).createdAt || new Date(),
      customer: sale.customerSnapshot,
      salesPerson: sale.salesPersonId,
      items: sale.items,
      subTotal: sale.subTotal,
      discountAmount: sale.discountAmount,
      vatRate: sale.vatRate,
      vatAmount: sale.vatAmount,
      grandTotal: sale.grandTotal,
      amountPaid: sale.amountPaid,
      paymentStatus: sale.paymentStatus,
      payments: sale.payments,
      notes: sale.notes,
    });
  } catch (error) {
    console.error("Get sale invoice error:", error);
    return next(error);
  }
};
