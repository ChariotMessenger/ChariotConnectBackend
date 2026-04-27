import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CustomError } from "./errorHandler";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: string;
    role?: string;
    permissions?: string[];
  };
}

export const authenticateAdmin = (
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

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.userType !== "ADMIN") {
      throw new CustomError("Unauthorized access", 403, "ADMIN_ONLY");
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType,
      role: decoded.role,
      permissions: decoded.permissions,
    };

    next();
  } catch (error: any) {
    logger.warn(`Admin Auth Error: ${error.message}`);

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError("Invalid token", 401, "INVALID_TOKEN"));
    }

    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError("Token expired", 401, "TOKEN_EXPIRED"));
    }

    next(error);
  }
};

export const checkPermission = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.userType !== "ADMIN") {
      return next(new CustomError("Access denied", 403, "FORBIDDEN"));
    }

    const permissions = req.user.permissions || [];

    const hasPermission =
      permissions.includes(requiredPermission) ||
      permissions.includes("SUPER_ADMIN") ||
      permissions.includes("ALL_PERMISSIONS");

    if (!hasPermission) {
      return next(
        new CustomError(
          `Insufficient permissions: ${requiredPermission} required`,
          403,
          "INSUFFICIENT_PERMS",
        ),
      );
    }

    next();
  };
};
