"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, statusCode, message, data) => {
    return res.status(statusCode).json({
        status: "true",
        message,
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, statusCode, message, error) => {
    return res.status(statusCode).json({
        status: "false",
        message,
        error: error || undefined,
    });
};
exports.sendError = sendError;
