import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CustomError } from "./errorHandler";
import { logger } from "../utils/logger";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new CustomError(
        "Authorization header is missing",
        401,
        "NO_AUTH_HEADER",
      );
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      throw new CustomError("Token is missing", 401, "NO_TOKEN");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_key",
    ) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType,
    };

    next();
  } catch (error: any) {
    logger.warn(`Auth Error: ${error.message}`);

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError("Invalid token", 401, "INVALID_TOKEN"));
    }

    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError("Token expired", 401, "TOKEN_EXPIRED"));
    }

    next(error);
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret_key",
      ) as any;

      req.user = {
        id: decoded.id,
        email: decoded.email,
        userType: decoded.userType,
      };
    }
  } catch (error) {
    logger.debug("Optional auth failed, continuing without user");
  }

  next();
};
