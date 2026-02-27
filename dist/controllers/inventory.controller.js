"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLowStockProducts = exports.getInventoryMovements = exports.adjustStock = exports.receiveStock = void 0;
const mongoose_1 = require("mongoose");
const config_1 = require("../config");
const response_1 = require("../utils/response");
const auditLog_1 = require("../utils/auditLog");
const Product_1 = __importDefault(require("../models/Product"));
const StockManegment_1 = __importDefault(require("../models/StockManegment"));
const Adjustments_1 = __importDefault(require("../models/Adjustments"));
// this is to receive stock (e.g. new shipment from supplier)
// 1. Finds the product
// 2. Increases product.currentStock
// 3. Creates a StockMovement record (the paper trail)
// 4. Logs to audit
const receiveStock = async (req, res, next) => {
    try {
        const { productId, quantity, supplierId, notes } = req.body;
        if (!productId || !quantity || !supplierId) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.INVENTORY_MESSAGES.MISSING_RECEIVE_FIELDS);
        }
        if (quantity <= 0) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.INVENTORY_MESSAGES.INVALID_QUANTITY);
        }
        // step 1: find the product
        const product = await Product_1.default.findById(productId);
        if (!product) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.INVENTORY_MESSAGES.PRODUCT_NOT_FOUND);
        }
        // step 2: save the old stock value (for the paper trail)
        const stockBefore = product.currentStock;
        const stockAfter = stockBefore + quantity;
        // step 3: update the product's current stock
        product.currentStock = stockAfter;
        await product.save();
        // step 4: create a StockMovement record (this is the paper trail)
        const movement = await StockManegment_1.default.create({
            productId: product._id,
            productName: product.name,
            movementType: "receive",
            quantityChange: quantity, // positive = stock added
            stockBefore,
            stockAfter,
            performedBy: req.body.performedBy || new mongoose_1.Types.ObjectId(),
            notes: notes || `Received ${quantity} units from supplier`,
        });
        // step 5: log to audit trail
        await (0, auditLog_1.logAudit)(null, "System", "RECEIVE_STOCK", `Received ${quantity} units of ${product.name} (${stockBefore} → ${stockAfter})`, "inventory");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, config_1.INVENTORY_MESSAGES.STOCK_RECEIVED, {
            product: {
                _id: product._id,
                name: product.name,
                currentStock: product.currentStock,
            },
            movement,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Receive stock error:", error);
        return next(error);
    }
};
exports.receiveStock = receiveStock;
// this is to adjust stock (e.g. damaged, stolen, miscounted)
// 1. Finds the product
// 2. Creates an Adjustment record (the reason WHY)
// 3. Updates product.currentStock
// 4. Creates a StockMovement record (the paper trail)
// 5. Logs to audit
const adjustStock = async (req, res, next) => {
    try {
        const { productId, adjustmentType, quantityChange, reason, notes } = req.body;
        if (!productId ||
            !adjustmentType ||
            quantityChange === undefined ||
            !reason) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.INVENTORY_MESSAGES.MISSING_ADJUST_FIELDS);
        }
        // step 1: find the product
        const product = await Product_1.default.findById(productId);
        if (!product) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, config_1.INVENTORY_MESSAGES.PRODUCT_NOT_FOUND);
        }
        // step 2: calculate new stock and check it won't go negative
        const stockBefore = product.currentStock;
        const stockAfter = stockBefore + quantityChange; // quantityChange can be negative (e.g. -3 for damage)
        if (stockAfter < 0) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.INVENTORY_MESSAGES.INSUFFICIENT_STOCK);
        }
        // step 3: create the Adjustment record (WHY the stock changed)
        const adjustment = await Adjustments_1.default.create({
            productId: product._id,
            adjustmentType,
            quantityChange,
            reason,
            performedBy: req.body.performedBy || new mongoose_1.Types.ObjectId(),
        });
        // step 4: update the product's current stock
        product.currentStock = stockAfter;
        await product.save();
        // step 5: create a StockMovement record (the paper trail)
        await StockManegment_1.default.create({
            productId: product._id,
            productName: product.name,
            movementType: "adjustment",
            quantityChange,
            stockBefore,
            stockAfter,
            referenceId: adjustment._id,
            referenceModel: "Adjustment",
            performedBy: req.body.performedBy || new mongoose_1.Types.ObjectId(),
            notes: notes || reason,
        });
        // step 6: log to audit trail
        await (0, auditLog_1.logAudit)(null, "System", "ADJUST_STOCK", `Adjusted ${product.name}: ${quantityChange > 0 ? "+" : ""}${quantityChange} units (${adjustmentType}) — ${reason}`, "inventory");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.INVENTORY_MESSAGES.STOCK_ADJUSTED, {
            product: {
                _id: product._id,
                name: product.name,
                currentStock: product.currentStock,
            },
            adjustment,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Adjust stock error:", error);
        return next(error);
    }
};
exports.adjustStock = adjustStock;
const getInventoryMovements = async (req, res, next) => {
    try {
        const { from, to, productId } = req.query;
        const filter = {};
        if (productId)
            filter.productId = productId;
        if (from || to) {
            filter.createdAt = {};
            if (from) {
                filter.createdAt.$gte = new Date(from);
            }
            if (to) {
                filter.createdAt.$lte = new Date(to);
            }
        }
        const movements = await StockManegment_1.default.find(filter)
            .sort({
            createdAt: -1,
        })
            .populate("productId");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, movements.length > 0
            ? config_1.INVENTORY_MESSAGES.STOCK_SUCCESS
            : "No inventory found", movements);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("get all inventory movements error:", error);
        return next(error);
    }
};
exports.getInventoryMovements = getInventoryMovements;
const getLowStockProducts = async (req, res, next) => {
    try {
        const products = await Product_1.default.find({
            $expr: {
                $lte: ["$currentStock", "$reorderLevel"],
            },
            isActive: true,
        });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Reorder alerts fetched successfully", products);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Reorder alerts error:", error);
        return next(error);
    }
};
exports.getLowStockProducts = getLowStockProducts;
