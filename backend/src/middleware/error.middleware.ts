/**
 * Error Handling Middleware
 *
 * Centralized error handling for the API
 */

import { Request, Response, NextFunction } from "express";
import { config } from "../config/environment";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default to 500 server error
  let statusCode = 500;
  let message = "Internal server error";

  // If it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "ValidationError") {
    // Mongoose validation error
    statusCode = 400;
    message = err.message;
  } else if (err.name === "MongoError" && (err as any).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = "Resource already exists";
  } else if (err.name === "CastError") {
    // Invalid MongoDB ObjectId
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Only log unexpected server errors — skip 4xx noise (bot scans, missing routes, etc.)
  if (statusCode >= 500) {
    console.error("Error:", {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.isDevelopment && { stack: err.stack }),
  });
};

/**
 * Catch async errors (wrapper for async route handlers)
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

export default {
  AppError,
  errorHandler,
  catchAsync,
  notFound,
};
