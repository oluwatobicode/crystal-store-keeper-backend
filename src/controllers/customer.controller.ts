import { NextFunction, Request, Response } from "express";
import Customer from "../models/Customer";
import Counter from "../models/Counter";
import { sendError, sendSuccess } from "../utils/response";
import { CUSTOMER_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from "../config";
import { logAudit } from "../utils/auditLog";

// helper to auto-generate customerId e.g. CUST-0001
const generateCustomerId = async (): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "customerId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `CUST-${String(counter.seq).padStart(4, "0")}`;
};

// create a new customer
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fullname, phone, customerType } = req.body;

    if (!fullname || !phone || !customerType) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        CUSTOMER_MESSAGES.MISSING_FIELDS,
      );
    }

    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        CUSTOMER_MESSAGES.DUPLICATE_PHONE,
      );
    }

    const customerId = await generateCustomerId();

    const newCustomer = await Customer.create({
      ...req.body,
      customerId,
    });

    await logAudit(
      null,
      "System",
      "CREATE_CUSTOMER",
      `Created customer: ${newCustomer.fullname} (${newCustomer.customerId})`,
      "customers",
    );

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      CUSTOMER_MESSAGES.CREATED,
      newCustomer,
    );
  } catch (error) {
    console.error("Create customer error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};

// this is to get all customers
export const getAllCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const customers = await Customer.find();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      customers.length > 0 ? CUSTOMER_MESSAGES.FETCHED : "No customers found",
      customers,
    );
  } catch (error) {
    console.error("Get all customers error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};

// this is to get a single customer
export const getACustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const customer = await Customer.findById(req.params.id);

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
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};

// this is to update a customer
export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, CUSTOMER_MESSAGES.NOT_FOUND);
    }

    // if phone is being changed, check for duplicates
    if (req.body.phone && req.body.phone !== customer.phone) {
      const duplicatePhone = await Customer.findOne({ phone: req.body.phone });
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
      null,
      "System",
      "UPDATE_CUSTOMER",
      `Updated customer: ${updatedCustomer?.fullname} (${updatedCustomer?.customerId})`,
      "customers",
    );

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      CUSTOMER_MESSAGES.UPDATED,
      updatedCustomer,
    );
  } catch (error) {
    console.error("Update customer error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};

// delete a customer
export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, CUSTOMER_MESSAGES.NOT_FOUND);
    }

    await Customer.findByIdAndDelete(req.params.id);

    await logAudit(
      null,
      "System",
      "DELETE_CUSTOMER",
      `Deleted customer: ${customer.fullname} (${customer.customerId})`,
      "customers",
    );

    return sendSuccess(res, HTTP_STATUS.OK, CUSTOMER_MESSAGES.DELETED);
  } catch (error) {
    console.error("Delete customer error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};
