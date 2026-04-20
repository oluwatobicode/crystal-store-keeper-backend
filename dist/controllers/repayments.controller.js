"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerCreditHistory = exports.recordRepayment = void 0;
const response_1 = require("../utils/response");
const config_1 = require("../config");
const Customer_1 = __importDefault(require("../models/Customer"));
const creditRepaymentSchema_1 = __importDefault(require("../models/creditRepaymentSchema"));
const Sale_1 = __importDefault(require("../models/Sale"));
const mongoose_1 = __importDefault(require("mongoose"));
const auditLog_1 = require("../utils/auditLog");
const recordRepayment = async (req, res, next) => {
    let session;
    const businessId = req.businessId;
    try {
        const { customerId, amount, paymentMethod, reference, note } = req.body;
        if (!customerId || !amount || !paymentMethod) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, "Missing required fields");
        }
        session = await mongoose_1.default.startSession();
        session.startTransaction();
        // 1. Fetch the customer first so we can validate before touching anything
        const customer = await Customer_1.default.findOne({
            _id: customerId,
            businessId,
        }).session(session);
        if (!customer) {
            await session.abortTransaction();
            session.endSession();
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, "Customer not found");
        }
        // 2. repayment cannot exceed what the customer actually owes
        if (amount > customer.currentBalance) {
            await session.abortTransaction();
            session.endSession();
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, `Repayment amount (${amount}) exceeds customer balance (${customer.currentBalance})`);
        }
        // 3. Record the repayment
        const [repaidCredit] = await creditRepaymentSchema_1.default.create([
            {
                customerId,
                businessId,
                salesPersonId: req.user._id,
                amount,
                paymentMethod,
                reference,
                note,
            },
        ], { session });
        // 4. Now safely deduct — we know the result won't go negative
        const updatedCustomer = await Customer_1.default.findByIdAndUpdate(customerId, { $inc: { currentBalance: -amount } }, { new: true, session });
        await session.commitTransaction();
        session.endSession();
        // 5. Audit log (outside transaction — non-critical)
        await (0, auditLog_1.logAudit)(req.user._id, `${req.user.fullname}`, "CREDIT_REPAYMENT", `Recorded repayment of ${amount} for customer ${customerId}`, "credit", businessId);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Repayment recorded successfully", {
            repaidCredit,
            customer: updatedCustomer,
        });
    }
    catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        console.log(error);
        next(error);
    }
};
exports.recordRepayment = recordRepayment;
const customerCreditHistory = async (req, res, next) => {
    try {
        const businessId = req.businessId;
        const { customerId } = req.params;
        // 1. Fetch customer
        const customer = await Customer_1.default.findOne({ _id: customerId, businessId });
        if (!customer) {
            return (0, response_1.sendError)(res, config_1.HTTP_STATUS.NOT_FOUND, "Customer not found");
        }
        // 2. Fetch all credit sales
        const creditSales = await Sale_1.default.find({
            customerId,
            businessId,
            "payments.method": "credit",
        })
            .select("invoiceId grandTotal amountPaid balanceDue creditDueDate paymentStatus payments createdAt")
            .sort({ createdAt: -1 });
        // 3. Fetch all repayments
        const repayments = await creditRepaymentSchema_1.default.find({
            customerId,
            businessId,
        })
            .select("amount paymentMethod reference note createdAt")
            .sort({ createdAt: -1 });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Credit history fetched", {
            creditLimit: customer.creditLimit,
            currentBalance: customer.currentBalance,
            creditSales,
            repayments,
        });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};
exports.customerCreditHistory = customerCreditHistory;
