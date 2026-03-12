"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const AppError_1 = require("../utils/AppError");
function isDuplicateKeyError(err) {
    return (typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === 11000);
}
function isMongoValidationError(err) {
    return (typeof err === "object" &&
        err !== null &&
        err.name === "ValidationError" &&
        "errors" in err);
}
function isMongooseCastError(err) {
    return (typeof err === "object" &&
        err !== null &&
        err.name === "CastError");
}
function isJwtError(err) {
    return (typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err.name === "JsonWebTokenError" ||
            err.name === "TokenExpiredError" ||
            err.name === "NotBeforeError"));
}
function buildErrorPayload(params) {
    const payload = {
        success: false,
        message: params.message,
    };
    if (params.errors && params.errors.length > 0) {
        payload.errors = params.errors;
    }
    if (params.stack) {
        payload.stack = params.stack;
    }
    return payload;
}
const globalErrorHandler = (err, req, res, _next) => {
    const env = process.env.NODE_ENV || "development";
    let statusCode = 500;
    let message = "Something went wrong";
    let validationErrors;
    // 1. Known operational error (thrown intentionally)
    if (err instanceof AppError_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    // 2. Mongoose validation error (e.g. required field missing, enum mismatch)
    else if (isMongoValidationError(err)) {
        statusCode = 400;
        message = "Validation failed";
        validationErrors = Object.values(err.errors).map((e) => ({
            field: e.path || "unknown",
            message: e.message || "Invalid value",
        }));
    }
    // 3. Mongoose duplicate key error
    else if (isDuplicateKeyError(err)) {
        statusCode = 409;
        const fields = Object.keys(err.keyValue).join(", ");
        message = `Duplicate value for field(s): ${fields}`;
    }
    // 4. Mongoose cast error (e.g. invalid ObjectId)
    else if (isMongooseCastError(err)) {
        statusCode = 400;
        message = `Invalid value for field "${err.path}": ${err.value}`;
    }
    // 5. JWT errors
    else if (isJwtError(err)) {
        statusCode = 401;
        message =
            err.name === "TokenExpiredError"
                ? "Your session has expired, please log in again"
                : "Invalid token, please log in again";
    }
    // Build and send response
    const payload = buildErrorPayload({
        message,
        errors: validationErrors,
        // Only expose stack trace in development
        stack: env === "development" && err instanceof Error ? err.stack : undefined,
    });
    res.status(statusCode).json(payload);
};
exports.globalErrorHandler = globalErrorHandler;
