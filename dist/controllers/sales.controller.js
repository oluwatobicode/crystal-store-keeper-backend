"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSaleInvoice = exports.getASale = exports.getAllSales = exports.createSale = void 0;
const config_1 = require("../config");
const response_1 = require("../utils/response");
const mongoose_1 = __importDefault(require("mongoose"));
const Sale_1 = __importDefault(require("../models/Sale"));
const Product_1 = __importDefault(require("../models/Product"));
const StockMovement_1 = __importDefault(require("../models/StockMovement"));
const Customer_1 = __importDefault(require("../models/Customer"));
const Counter_1 = __importDefault(require("../models/Counter"));
const Setting_1 = __importDefault(require("../models/Setting"));
const auditLog_1 = require("../utils/auditLog");
const notification_1 = require("../utils/notification");
const createSale = async (req, res, next) => {
    let session;
    try {
        const businessId = req.businessId;
        // 1. Validate the request body
        const { items, payments, customerId, discountAmount, notes } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, "Items are required");
        }
        if (!payments || !Array.isArray(payments) || payments.length === 0) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, "Payments are required");
        }
        // 2. Start a Mongoose session & transaction
        session = await mongoose_1.default.startSession();
        session.startTransaction();
        // 3. Fetch business settings (needed for invoice prefix + VAT)
        const settings = await Setting_1.default.findOne({ businessId }).session(session);
        if (!settings) {
            await session.abortTransaction();
            session.endSession();
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, "Business settings not found");
        }
        // 4. Generate invoice ID atomically via Counter collection
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
        const prefix = settings.invoice.prefix || "INV";
        const counterKey = `invoice-${dateStr}-${businessId}`;
        const counter = await Counter_1.default.findOneAndUpdate({ _id: counterKey, businessId }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after", session });
        const invoiceId = `${prefix}-${dateStr}-${String(counter.seq).padStart(4, "0")}`;
        // 5. Look up & validate every product (within the session)
        const validatedItems = [];
        for (const item of items) {
            const product = await Product_1.default.findOne({
                _id: item.productId,
                businessId,
            }).session(session);
            if (!product) {
                await session.abortTransaction();
                session.endSession();
                return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, `Product ${item.productId} not found`);
            }
            if (product.currentStock < item.quantity) {
                await session.abortTransaction();
                session.endSession();
                return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, `Insufficient stock for ${product.name}. Available: ${product.currentStock}`);
            }
            // 6. Deduct stock
            const stockBefore = product.currentStock;
            product.currentStock -= item.quantity;
            await product.save({ session });
            // 6b. Fire low-stock notification if stock hits or falls below reorder level (fire-and-forget)
            if (product.currentStock <= product.reorderLevel) {
                (0, notification_1.createNotification)(req.user._id, businessId, "⚠️ Low Stock Alert", `"${product.name}" is running low — only ${product.currentStock} ${product.unit}(s) left (reorder level: ${product.reorderLevel}).`, "warning", product._id.toString()).catch(console.error);
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
        let amountPaid = 0;
        payments.forEach((payment) => {
            amountPaid += payment.amount;
        });
        // 8. Validate split payments: sum must equal grandTotal
        if (Math.abs(amountPaid - grandTotal) > 0.01) {
            await session.abortTransaction();
            session.endSession();
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, `Payment total (${amountPaid}) does not match grand total (${grandTotal})`);
        }
        const paymentStatus = amountPaid >= grandTotal
            ? "paid"
            : amountPaid > 0
                ? "partial"
                : "pending";
        // 9. Fetch customer snapshot (if provided)
        let customerSnapshot = { name: "Walk-in Customer", phone: "" };
        if (customerId) {
            const customer = await Customer_1.default.findById(customerId).session(session);
            if (customer) {
                customerSnapshot = {
                    name: customer.fullname,
                    phone: customer.phone || "",
                };
            }
        }
        // 10. Create the sale
        const [sale] = await Sale_1.default.create([
            {
                invoiceId,
                salesPersonId: req.user._id,
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
            },
        ], { session });
        // 11. Create StockMovement records for each item
        for (const item of validatedItems) {
            await StockMovement_1.default.create([
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
                    performedBy: req.user._id,
                    notes: `Sold ${item.quantity} units via ${invoiceId}`,
                },
            ], { session });
        }
        // 12. Update customer balance & totalSpent (if a customer is linked)
        if (customerId) {
            const owedAmount = grandTotal - amountPaid;
            const updateFields = {
                totalSpent: amountPaid,
            };
            if (owedAmount > 0) {
                updateFields.currentBalance = owedAmount;
            }
            await Customer_1.default.findByIdAndUpdate(customerId, { $inc: updateFields }, { session });
        }
        // 13. Commit transaction
        await session.commitTransaction();
        session.endSession();
        // 14. Audit log (outside transaction — non-critical)
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "CREATE_SALE", `Created sale ${invoiceId} — ${validatedItems.length} item(s), total: ${grandTotal}`, "sales", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, "Sale created successfully", sale);
    }
    catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        console.error("Create sale error:", error);
        return next(error);
    }
};
exports.createSale = createSale;
const getAllSales = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { from, to, paymentStatus, customerId } = req.query;
        const filter = { businessId };
        if (paymentStatus)
            filter.paymentStatus = paymentStatus;
        if (customerId)
            filter.customerId = customerId;
        if (from || to) {
            filter.createdAt = {};
            if (from)
                filter.createdAt.$gte = new Date(from);
            if (to)
                filter.createdAt.$lte = new Date(to);
        }
        const sales = await Sale_1.default.find(filter)
            .sort({ createdAt: -1 })
            .populate("customerId", "fullname phone")
            .populate("salesPersonId", "fullname");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, sales.length > 0 ? "Sales fetched successfully" : "No sales found", sales);
    }
    catch (error) {
        console.error("Get all sales error:", error);
        return next(error);
    }
};
exports.getAllSales = getAllSales;
const getASale = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { id } = req.params;
        const sale = await Sale_1.default.findOne({ _id: id, businessId })
            .populate("customerId", "fullname phone email")
            .populate("salesPersonId", "fullname");
        if (!sale) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, "Sale not found");
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Sale fetched successfully", sale);
    }
    catch (error) {
        console.error("Get a sale error:", error);
        return next(error);
    }
};
exports.getASale = getASale;
const getSaleInvoice = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { id } = req.params;
        const sale = await Sale_1.default.findOne({ _id: id, businessId })
            .populate("customerId", "fullname phone email address")
            .populate("salesPersonId", "fullname");
        if (!sale) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, "Sale not found");
        }
        // return the sale data structured for invoice rendering
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Invoice fetched successfully", {
            invoiceId: sale.invoiceId,
            date: sale.createdAt || new Date(),
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
    }
    catch (error) {
        console.error("Get sale invoice error:", error);
        return next(error);
    }
};
exports.getSaleInvoice = getSaleInvoice;
