"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLogs = exports.getAllLogs = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const config_1 = require("../config");
const response_1 = require("../utils/response");
const plainjs_1 = require("@json2csv/plainjs");
// this is to get all audit logs with optional filtering
const getAllLogs = async (req, res, next) => {
    try {
        const { from, to, category, userId } = req.query;
        const filter = {};
        if (category)
            filter.category = category;
        if (userId)
            filter.userId = userId;
        if (from || to) {
            filter.timestamp = {};
            if (from)
                filter.timestamp.$gte = new Date(from);
            if (to)
                filter.timestamp.$lte = new Date(to);
        }
        const logs = await AuditLog_1.default.find(filter).sort({ createdAt: -1 });
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, logs.length > 0 ? config_1.AUDIT_LOG_MESSAGES.FETCHED : "No audit logs found", logs);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get all logs error:", error);
        return next(error);
    }
};
exports.getAllLogs = getAllLogs;
// this is to export audit logs as CSV
const exportLogs = async (req, res, next) => {
    try {
        const { from, to, category, userId } = req.query;
        const filter = {};
        if (category)
            filter.category = category;
        if (userId)
            filter.userId = userId;
        if (from || to) {
            filter.timestamp = {};
            if (from)
                filter.timestamp.$gte = new Date(from);
            if (to)
                filter.timestamp.$lte = new Date(to);
        }
        const logs = await AuditLog_1.default.find(filter).sort({ createdAt: -1 }).lean();
        if (!logs || logs.length === 0) {
            return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "No audit logs to export", []);
        }
        const fields = [
            "userSnapshot",
            "action",
            "details",
            "category",
            "timestamp",
        ];
        const opts = { fields };
        const parser = new plainjs_1.Parser(opts);
        const csv = parser.parse(logs);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
        return res.send(csv);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Export logs error:", error);
        return next(error);
    }
};
exports.exportLogs = exportLogs;
