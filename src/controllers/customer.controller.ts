import { NextFunction, Request, Response } from "express";
import Customer from "../models/Customer";
import Counter from "../models/Counter";
import { sendError, sendSuccess } from "../utils/response";
import { CUSTOMER_MESSAGES, HTTP_STATUS } from "../config";
import { logAudit } from "../utils/auditLog";
import Sale from "../models/Sale";

const generateCustomerId = async (businessId: string): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { _id: `${businessId}-customerId` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `CUST-${String(counter.seq).padStart(4, "0")}`;
};

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
    const { fullname, phone, customerType } = req.body;

    if (!fullname || !phone || !customerType) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        CUSTOMER_MESSAGES.MISSING_FIELDS,
      );
    }

    // scoped to this business only
    const existingCustomer = await Customer.findOne({ phone, businessId });
    if (existingCustomer) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        CUSTOMER_MESSAGES.DUPLICATE_PHONE,
      );
    }

    const customerId = await generateCustomerId(businessId);

    const newCustomer = await Customer.create({
      ...req.body,
      customerId,
      businessId,
    });

    await logAudit(
      req.user!._id,
      `${req.user!.fullname}`,
      "CREATE_CUSTOMER",
      `Created customer: ${newCustomer.fullname} (${newCustomer.customerId})`,
      "customers",
      businessId,
    );

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      CUSTOMER_MESSAGES.CREATED,
      newCustomer,
    );
  } catch (error) {
    console.error("Create customer error:", error);
    return next(error);
  }
};

export const getAllCustomers = async (
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

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      customers.length > 0 ? CUSTOMER_MESSAGES.FETCHED : "No customers found",
      customers,
    );
  } catch (error) {
    console.error("Get all customers error:", error);
    return next(error);
  }
};

export const getACustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const customer = await Customer.findOne({ _id: req.params.id, businessId });

    if (!customer) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, CUSTOMER_MESSAGES.NOT_FOUND);
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      CUSTOMER_MESSAGES.FETCHED_ONE,
      customer,
    );
  } catch (error) {
    console.error("Get a customer error:", error);
    return next(error);
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const customer = await Customer.findOne({ _id: req.params.id, businessId });

    if (!customer) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, CUSTOMER_MESSAGES.NOT_FOUND);
    }

    if (req.body.phone && req.body.phone !== customer.phone) {
      const duplicatePhone = await Customer.findOne({
        phone: req.body.phone,
        businessId,
      });
      if (duplicatePhone) {
        return sendError(
          res,
          HTTP_STATUS.CONFLICT,
          CUSTOMER_MESSAGES.DUPLICATE_PHONE,
        );
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    await logAudit(
      req.user!._id,
      `${req.user!.fullname}`,
      "UPDATE_CUSTOMER",
      `Updated customer: ${updatedCustomer?.fullname} (${updatedCustomer?.customerId})`,
      "customers",
      businessId,
    );

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      CUSTOMER_MESSAGES.UPDATED,
      updatedCustomer,
    );
  } catch (error) {
    console.error("Update customer error:", error);
    return next(error);
  }
};

export const getCustomerTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const transactions = await Sale.find({
      customerId: req.params.id,
      businessId,
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      transactions.length > 0
        ? CUSTOMER_MESSAGES.FETCHED
        : "No transactions found",
      transactions,
    );
  } catch (error) {
    console.error("Get customer transactions error:", error);
    return next(error);
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;

    const customer = await Customer.findOne({ _id: req.params.id, businessId });

    if (!customer) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, CUSTOMER_MESSAGES.NOT_FOUND);
    }

    await Customer.findByIdAndDelete(req.params.id);

    await logAudit(
      req.user!._id,
      `${req.user!.fullname}`,
      "DELETE_CUSTOMER",
      `Deleted customer: ${customer.fullname} (${customer.customerId})`,
      "customers",
      businessId,
    );

    return sendSuccess(res, HTTP_STATUS.OK, CUSTOMER_MESSAGES.DELETED);
  } catch (error) {
    console.error("Delete customer error:", error);
    return next(error);
  }
};
