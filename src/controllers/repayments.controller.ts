import { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/response";
import { HTTP_STATUS } from "../config";
import Customer from "../models/Customer";
import CreditRepayment from "../models/creditRepaymentSchema";
import Sale from "../models/Sale";
import mongoose from "mongoose";
import { logAudit } from "../utils/auditLog";

export const recordRepayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let session: mongoose.ClientSession | undefined;
  const businessId = req.businessId!;
  try {
    const { customerId, amount, paymentMethod, reference, note } = req.body;

    if (!customerId || !amount || !paymentMethod) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Missing required fields");
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // 1. Fetch the customer first so we can validate before touching anything
    const customer = await Customer.findOne({
      _id: customerId,
      businessId,
    }).session(session);

    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Customer not found");
    }

    // 2. repayment cannot exceed what the customer actually owes
    if (amount > customer.currentBalance) {
      await session.abortTransaction();
      session.endSession();
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        `Repayment amount (${amount}) exceeds customer balance (${customer.currentBalance})`,
      );
    }

    // 3. Record the repayment
    const [repaidCredit] = await CreditRepayment.create(
      [
        {
          customerId,
          businessId,
          salesPersonId: req.user!._id,
          amount,
          paymentMethod,
          reference,
          note,
        },
      ],
      { session },
    );

    // 4. Now safely deduct — we know the result won't go negative
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { $inc: { currentBalance: -amount } },
      { new: true, session },
    );

    await session.commitTransaction();
    session.endSession();

    // 5. Audit log (outside transaction — non-critical)
    await logAudit(
      req.user!._id,
      `${req.user!.fullname}`,
      "CREDIT_REPAYMENT",
      `Recorded repayment of ${amount} for customer ${customerId}`,
      "credit",
      businessId,
    );

    return sendSuccess(res, HTTP_STATUS.OK, "Repayment recorded successfully", {
      repaidCredit,
      customer: updatedCustomer,
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.log(error);
    next(error);
  }
};

export const customerCreditHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
    const { customerId } = req.params;

    // 1. Fetch customer
    const customer = await Customer.findOne({ _id: customerId, businessId });
    if (!customer) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Customer not found");
    }

    // 2. Fetch all credit sales
    const creditSales = await Sale.find({
      customerId,
      businessId,
      "payments.method": "credit",
    })
      .select(
        "invoiceId grandTotal amountPaid balanceDue creditDueDate paymentStatus payments createdAt",
      )
      .sort({ createdAt: -1 });

    // 3. Fetch all repayments
    const repayments = await CreditRepayment.find({
      customerId,
      businessId,
    })
      .select("amount paymentMethod reference note createdAt")
      .sort({ createdAt: -1 });

    return sendSuccess(res, HTTP_STATUS.OK, "Credit history fetched", {
      creditLimit: customer.creditLimit,
      currentBalance: customer.currentBalance,
      creditSales,
      repayments,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
