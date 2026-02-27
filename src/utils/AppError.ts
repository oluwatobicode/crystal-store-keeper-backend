export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);

    this.statusCode = statusCode;
    this.details = details;
    this.name = "AppError";
    this.isOperational = true;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

