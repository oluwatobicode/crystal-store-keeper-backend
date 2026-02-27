import { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/response";
import { ERROR_MESSAGES, HTTP_STATUS, SUPPLIER_MESSAGES } from "../config";
import Supplier from "../models/Supplier";
import { logAudit } from "../utils/auditLog";

// this will help in creating a supplier
export const createSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, contactPerson, phone, email } = req.body;

    if (!name || !contactPerson || !phone || !email) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        SUPPLIER_MESSAGES.MISSING_FIELDS,
      );
    }

    const newSupplier = await Supplier.create(req.body);

    await logAudit(
      null,
      "System",
      "CREATE_SUPPLIER",
      `Created supplier: ${newSupplier.name}`,
      "inventory",
    );

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      SUPPLIER_MESSAGES.CREATED,
      newSupplier,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Create supplier error:", error);
    return next(error);
  }
};

export const getAllSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const suppliers = await Supplier.find();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      suppliers.length > 0 ? SUPPLIER_MESSAGES.FETCHED : "No suppliers found",
      suppliers,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get all suppliers error:", error);
    return next(error);
  }
};

export const getASupplier = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, SUPPLIER_MESSAGES.NOT_FOUND);
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUPPLIER_MESSAGES.FETCHED_ONE,
      supplier,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get a supplier error:", error);
    return next(error);
  }
};

// this will be used to update a supplier
export const updateSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, SUPPLIER_MESSAGES.NOT_FOUND);
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    await logAudit(
      null,
      "System",
      "UPDATE_SUPPLIER",
      `Updated supplier: ${updatedSupplier?.name}`,
      "inventory",
    );

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      SUPPLIER_MESSAGES.UPDATED,
      updatedSupplier,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update supplier error:", error);
    return next(error);
  }
};

// this will delete a supplier
export const deleteSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, SUPPLIER_MESSAGES.NOT_FOUND);
    }

    await Supplier.findByIdAndDelete(req.params.id);

    await logAudit(
      null,
      "System",
      "DELETE_SUPPLIER",
      `Deleted supplier: ${supplier.name}`,
      "inventory",
    );

    return sendSuccess(res, HTTP_STATUS.OK, SUPPLIER_MESSAGES.DELETED);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Delete supplier error:", error);
    return next(error);
  }
};
