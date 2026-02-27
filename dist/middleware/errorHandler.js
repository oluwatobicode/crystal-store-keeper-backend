"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_1 = require("../utils/response");
const config_1 = require("../config");
const AppError_1 = require("../utils/AppError");
// Centralized Express error-handling middleware
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    // AppError: expected / operational errors with explicit status codes
    if (err instanceof AppError_1.AppError) {
        return (0, response_1.sendError)(res, err.statusCode, err.message);
    }
    // Handle common Mongoose / validation-like errors by shape
    if (isMongoDuplicateKeyError(err)) {
        return (0, response_1.sendError)(res, config_1.HTTP_STATUS.CONFLICT, config_1.ERROR_MESSAGES.DUPLICATE_ENTRY);
    }
    if (isMongoValidationError(err)) {
        return (0, response_1.sendError)(res, config_1.HTTP_STATUS.BAD_REQUEST, config_1.ERROR_MESSAGES.VALIDATION_ERROR);
    }
    // Fallback: unknown / programming errors
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
    return (0, response_1.sendError)(res, config_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, config_1.ERROR_MESSAGES.SERVER_ERROR);
};
exports.errorHandler = errorHandler;
const isMongoDuplicateKeyError = (err) => {
    return (typeof err === "object" &&
        err !== null &&
        err.code === 11000);
};
const isMongoValidationError = (err) => {
    return (typeof err === "object" &&
        err !== null &&
        err.name === "ValidationError");
};
