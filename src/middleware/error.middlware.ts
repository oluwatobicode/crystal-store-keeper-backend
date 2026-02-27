import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

type ValidationFieldError = {
  field: string;
  message: string;
};

function isDuplicateKeyError(err: unknown): err is {
  code: number;
  keyValue: Record<string, unknown>;
} {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  );
}

function isMongoValidationError(err: unknown): err is {
  name: "ValidationError";
  errors: Record<string, { path?: string; message?: string }>;
} {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "ValidationError" &&
    "errors" in err
  );
}

function isMongooseCastError(err: unknown): err is {
  name: "CastError";
  path?: string;
  value?: unknown;
  message?: string;
} {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "CastError"
  );
}

function isJwtError(err: unknown): err is { name: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    ((err as { name: string }).name === "JsonWebTokenError" ||
      (err as { name: string }).name === "TokenExpiredError" ||
      (err as { name: string }).name === "NotBeforeError")
  );
}

function buildErrorPayload(params: {
  message: string;
  errors?: ValidationFieldError[];
  stack?: string;
}) {
  const payload: {
    success: false;
    message: string;
    errors?: ValidationFieldError[];
    stack?: string;
  } = {
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

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const env = process.env.NODE_ENV || "development";

  let statusCode = 500;
  let message = "Something went wrong";
  let validationErrors: ValidationFieldError[] | undefined;

  // 1. Known operational error (thrown intentionally)
  if (err instanceof AppError) {
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
    stack:
      env === "development" && err instanceof Error ? err.stack : undefined,
  });

  res.status(statusCode).json(payload);
};
