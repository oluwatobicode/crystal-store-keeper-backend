import { NextFunction, Request, Response } from "express";
import AuditLog from "../models/AuditLog";
import { AUDIT_LOG_MESSAGES, ERROR_MESSAGES, HTTP_STATUS } from "../config";
import { sendError, sendSuccess } from "../utils/response";
import { Parser } from "@json2csv/plainjs";

// this is to get all audit logs with optional filtering
export const getAllLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to, category, userId } = req.query;
    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;
    if (userId) filter.userId = userId;

    if (from || to) {
      filter.timestamp = {} as Record<string, Date>;
      if (from)
        (filter.timestamp as Record<string, Date>).$gte = new Date(
          from as string,
        );
      if (to)
        (filter.timestamp as Record<string, Date>).$lte = new Date(
          to as string,
        );
    }

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      logs.length > 0 ? AUDIT_LOG_MESSAGES.FETCHED : "No audit logs found",
      logs,
    );
  } catch (error) {
    console.error("Get all logs error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};

// this is to export audit logs as CSV
export const exportLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to, category, userId } = req.query;
    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.timestamp = {} as Record<string, Date>;
      if (from)
        (filter.timestamp as Record<string, Date>).$gte = new Date(
          from as string,
        );
      if (to)
        (filter.timestamp as Record<string, Date>).$lte = new Date(
          to as string,
        );
    }

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).lean();

    if (!logs || logs.length === 0) {
      return sendSuccess(res, HTTP_STATUS.OK, "No audit logs to export", []);
    }

    const fields = [
      "userSnapshot",
      "action",
      "details",
      "category",
      "timestamp",
    ];
    const opts = { fields };

    const parser = new Parser(opts);
    const csv = parser.parse(logs);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");

    return res.send(csv);
  } catch (error) {
    console.error("Export logs error:", error);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
    );
  }
};
