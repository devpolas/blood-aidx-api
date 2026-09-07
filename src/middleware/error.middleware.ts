import type { ErrorRequestHandler, Response } from "express";
import { isStructuredError } from "@prisma/orm-postgres/utils/structured-error";
import { ZodError } from "zod";

import { AppError } from "../utils/appError";

// JWT Error

const handleJWTError = (): AppError => {
  return new AppError("Please login first!", 401);
};

// Zod Error

const handleZodError = (err: ZodError): AppError => {
  const message = err.issues
    .map(
      (issue) =>
        `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}`,
    )
    .join(", ");

  return new AppError(message, 400);
};

// Prisma 8 Error Mapping

const prismaNamespaceStatus: Record<string, number> = {
  ORM: 400,
  RUNTIME: 500,
  DRIVER: 503,
  MIGRATION: 500,
  CONTRACT: 500,
  PLAN: 400,
  BUDGET: 408,
};

const prismaErrorStatus: Record<string, number> = {
  // ORM

  "ORM.ARGUMENT_INVALID": 400,
  "ORM.FIELD_UNKNOWN": 400,
  "ORM.FILTER_UNSUPPORTED": 400,
  "ORM.MUTATION_DATA_MISSING": 400,

  // Not Found

  "ORM.MUTATION_ROW_MISSING": 404,
  "RUNTIME.NO_ROWS": 404,

  // Driver / Database

  "DRIVER.CONNECTION_FAILED": 503,

  // Runtime

  "RUNTIME.CONNECTION_CLOSED": 503,

  // Request Timeout

  "BUDGET.TIMEOUT": 408,
};

// Prisma Error Handler

const handlePrismaError = (err: unknown): AppError | null => {
  if (!isStructuredError(err)) {
    return null;
  }

  const namespace = err.code.split(".")[0] ?? "";

  const statusCode =
    prismaErrorStatus[err.code] ?? prismaNamespaceStatus[namespace] ?? 500;

  return new AppError(
    process.env.NODE_ENV === "development"
      ? err.message
      : "Database request failed.",
    statusCode,
  );
};

// Development Error Response

const sendDevError = (
  err: Error & {
    statusCode?: number;
    status?: string;
  },
  res: Response,
): void => {
  res.status(err.statusCode ?? 500).json({
    timestamp: new Date().toISOString(),
    success: false,
    status: err.status ?? "error",
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production Error Response

const sendProductionError = (err: AppError, res: Response): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      timestamp: new Date().toISOString(),
      success: false,
      status: err.status,
      message: err.message,
    });

    return;
  }

  res.status(500).json({
    timestamp: new Date().toISOString(),
    success: false,
    status: "error",
    message: "Something went very wrong!",
  });
};

// Global Error Handler

const globalErrorController: ErrorRequestHandler = (err, _req, res, _next) => {
  // Development

  if (process.env.NODE_ENV === "development") {
    sendDevError(err, res);
    return;
  }

  // Normalize Error

  let error: AppError;

  // Zod
  if (err instanceof ZodError) {
    error = handleZodError(err);
  }

  // JWT
  else if (
    err?.name === "JsonWebTokenError" ||
    err?.name === "TokenExpiredError"
  ) {
    error = handleJWTError();
  }

  // Prisma 8
  else {
    const prismaError = handlePrismaError(err);

    if (prismaError) {
      error = prismaError;
    }

    // Application error
    else if (err instanceof AppError) {
      error = err;
    }

    // Unknown error
    else {
      error = new AppError("Something went very wrong!", 500);
    }
  }

  // Production Response

  sendProductionError(error, res);
};

export default globalErrorController;
