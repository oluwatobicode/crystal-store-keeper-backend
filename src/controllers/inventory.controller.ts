import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { ERROR_MESSAGES, HTTP_STATUS, INVENTORY_MESSAGES } from "../config";
import { sendError, sendSuccess } from "../utils/response";
import { logAudit } from "../utils/auditLog";
import Product from "../models/Product";
import StockMovement from "../models/StockManegment";
import Adjustment from "../models/Adjustments";

// this is to receive stock (e.g. new shipment from supplier)
// 1. Finds the product
// 2. Increases product.currentStock
// 3. Creates a StockMovement record (the paper trail)
// 4. Logs to audit
export const receiveStock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, quantity, supplierId, notes } = req.body;

    if (!productId || !quantity || !supplierId) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        INVENTORY_MESSAGES.MISSING_RECEIVE_FIELDS,
      );
    }

    if (quantity <= 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        INVENTORY_MESSAGES.INVALID_QUANTITY,
      );
    }

    // step 1: find the product
    const product = await Product.findById(productId);
    if (!product) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        INVENTORY_MESSAGES.PRODUCT_NOT_FOUND,
      );
    }

    // step 2: save the old stock value (for the paper trail)
    const stockBefore = product.currentStock;
    const stockAfter = stockBefore + quantity;

    // step 3: update the product's current stock
    product.currentStock = stockAfter;
    await product.save();

    // step 4: create a StockMovement record (this is the paper trail)
    const movement = await StockMovement.create({
      productId: product._id,
      productName: product.name,
      movementType: "receive",
      quantityChange: quantity, // positive = stock added
      stockBefore,
      stockAfter,
      performedBy: req.body.performedBy || new Types.ObjectId(),
      notes: notes || `Received ${quantity} units from supplier`,
    });

    // step 5: log to audit trail
    await logAudit(
      null,
      "System",
      "RECEIVE_STOCK",
      `Received ${quantity} units of ${product.name} (${stockBefore} → ${stockAfter})`,
      "inventory",
    );

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      INVENTORY_MESSAGES.STOCK_RECEIVED,
      {
        product: {
          _id: product._id,
          name: product.name,
          currentStock: product.currentStock,
        },
        movement,
      },
    );
  } catch (error) {
    console.error("Receive stock error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};

// this is to adjust stock (e.g. damaged, stolen, miscounted)
// 1. Finds the product
// 2. Creates an Adjustment record (the reason WHY)
// 3. Updates product.currentStock
// 4. Creates a StockMovement record (the paper trail)
// 5. Logs to audit
export const adjustStock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, adjustmentType, quantityChange, reason, notes } =
      req.body;

    if (
      !productId ||
      !adjustmentType ||
      quantityChange === undefined ||
      !reason
    ) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        INVENTORY_MESSAGES.MISSING_ADJUST_FIELDS,
      );
    }

    // step 1: find the product
    const product = await Product.findById(productId);
    if (!product) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        INVENTORY_MESSAGES.PRODUCT_NOT_FOUND,
      );
    }

    // step 2: calculate new stock and check it won't go negative
    const stockBefore = product.currentStock;
    const stockAfter = stockBefore + quantityChange; // quantityChange can be negative (e.g. -3 for damage)

    if (stockAfter < 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        INVENTORY_MESSAGES.INSUFFICIENT_STOCK,
      );
    }

    // step 3: create the Adjustment record (WHY the stock changed)
    const adjustment = await Adjustment.create({
      productId: product._id,
      adjustmentType,
      quantityChange,
      reason,
      performedBy: req.body.performedBy || new Types.ObjectId(),
    });

    // step 4: update the product's current stock
    product.currentStock = stockAfter;
    await product.save();

    // step 5: create a StockMovement record (the paper trail)
    await StockMovement.create({
      productId: product._id,
      productName: product.name,
      movementType: "adjustment",
      quantityChange,
      stockBefore,
      stockAfter,
      referenceId: adjustment._id,
      referenceModel: "Adjustment",
      performedBy: req.body.performedBy || new Types.ObjectId(),
      notes: notes || reason,
    });

    // step 6: log to audit trail
    await logAudit(
      null,
      "System",
      "ADJUST_STOCK",
      `Adjusted ${product.name}: ${quantityChange > 0 ? "+" : ""}${quantityChange} units (${adjustmentType}) — ${reason}`,
      "inventory",
    );

    return sendSuccess(res, HTTP_STATUS.OK, INVENTORY_MESSAGES.STOCK_ADJUSTED, {
      product: {
        _id: product._id,
        name: product.name,
        currentStock: product.currentStock,
      },
      adjustment,
    });
  } catch (error) {
    console.error("Adjust stock error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};

export const getInventoryMovements = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to, productId } = req.query;
    const filter: Record<string, unknown> = {};

    if (productId) filter.productId = productId;

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

    const movements = await StockMovement.find(filter)
      .sort({
        createdAt: -1,
      })
      .populate("productId");

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      movements.length > 0
        ? INVENTORY_MESSAGES.STOCK_SUCCESS
        : "No inventory found",
      movements,
    );
  } catch (error) {
    console.error("get all inventory movements error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};

export const getLowStockProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await Product.find({
      $expr: {
        $lte: ["$currentStock", "$reorderLevel"],
      },
      isActive: true,
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      "Reorder alerts fetched successfully",
      products,
    );
  } catch (error) {
    console.error("Reorder alerts error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};
