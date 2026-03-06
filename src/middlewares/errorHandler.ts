import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export class CustomError extends Error implements AppError {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "CustomError";
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const status = (err as AppError).status || 500;
  const message = err.message || "Internal Server Error";
  const code = (err as AppError).code || "INTERNAL_ERROR";

  logger.error(
    `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`,
  );

  // Avoid sending response twice
  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    success: false,
    message,
    code,
    path: req.originalUrl,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
