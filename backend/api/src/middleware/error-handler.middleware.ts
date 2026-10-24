import { Request, Response, NextFunction } from "express";

export interface ApiErrorResponse {
  readonly error: string;
  readonly message?: string;
  readonly statusCode: number;
  readonly timestamp: string;
}

/**
 * Standard Application Error with HTTP status code
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Route Not Found Middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiErrorResponse = {
    error: "Not Found",
    message: `Resource '${req.method} ${req.originalUrl}' not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
}

/**
 * Global Exception and Error Handling Middleware.
 * Prevents stack trace leakages and standardizes JSON error payloads.
 */
export function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const errorTitle =
    statusCode >= 500 ? "Internal Server Error" : "Bad Request";

  // Safe logging without leaking sensitive internals to clients
  console.error(
    `[GlobalErrorHandler] [${req.method} ${req.originalUrl}] [${statusCode}] ${err.message}`,
  );

  const response: ApiErrorResponse = {
    error: errorTitle,
    message:
      statusCode >= 500 ? "An unexpected server error occurred." : err.message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}
