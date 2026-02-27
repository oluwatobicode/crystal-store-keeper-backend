import { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/response";
import Product from "../models/Product";
import { HTTP_STATUS, ERROR_MESSAGES, PRODUCT_MESSAGES } from "../config";

// Create Product
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, unit, SKU, purchaseCost, sellingPrice } = req.body;

    // Validate required fields
    if (
      !name ||
      !unit ||
      !SKU ||
      purchaseCost == null ||
      sellingPrice == null
    ) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        PRODUCT_MESSAGES.MISSING_FIELDS,
      );
    }

    // Check for duplicate SKU
    const existingProduct = await Product.findOne({ SKU: SKU.toUpperCase() });
    if (existingProduct) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        PRODUCT_MESSAGES.DUPLICATE_SKU,
      );
    }

    const newProduct = await Product.create(req.body);

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      PRODUCT_MESSAGES.CREATED,
      newProduct,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Create product error:", error);
    return next(error);
  }
};

// Get All Products
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await Product.find();

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      products.length > 0 ? PRODUCT_MESSAGES.FETCHED : "No products found",
      products,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get all products error:", error);
    return next(error);
  }
};

// Get Single Product
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, PRODUCT_MESSAGES.NOT_FOUND);
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      PRODUCT_MESSAGES.FETCHED_ONE,
      product,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Get product by ID error:", error);
    return next(error);
  }
};

// this will help to update Product
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, PRODUCT_MESSAGES.NOT_FOUND);
    }

    // If SKU is being changed, check for duplicates
    if (req.body.SKU && req.body.SKU.toUpperCase() !== product.SKU) {
      const duplicateSKU = await Product.findOne({
        SKU: req.body.SKU.toUpperCase(),
      });
      if (duplicateSKU) {
        return sendError(
          res,
          HTTP_STATUS.CONFLICT,
          PRODUCT_MESSAGES.DUPLICATE_SKU,
        );
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      PRODUCT_MESSAGES.UPDATED,
      updatedProduct,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update product error:", error);
    return next(error);
  }
};

//  Delete a Product
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, PRODUCT_MESSAGES.NOT_FOUND);
    }

    await Product.findByIdAndDelete(req.params.id);

    return sendSuccess(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.DELETED);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Delete product error:", error);
    return next(error);
  }
};
