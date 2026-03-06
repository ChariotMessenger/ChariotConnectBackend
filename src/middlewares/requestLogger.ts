import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "warn" : "http";

    logger.log({
      level,
      message: `${req.method} ${req.originalUrl}`,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  });

  next();
};
