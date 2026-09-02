import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import httpStatus from "http-status";

export default function notFound(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server.`,
      httpStatus.NOT_FOUND,
    ),
  );
}
