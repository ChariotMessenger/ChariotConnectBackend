import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const PERMISSIONS = {
  STAFF_CREATE: "staff:create",
  STAFF_READ: "staff:read",
  STAFF_UPDATE: "staff:update",
  STAFF_DELETE: "staff:delete",
  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  CLIENT_CREATE: "client:create",
  CLIENT_READ: "client:read",
  CLIENT_UPDATE: "client:update",
  CLIENT_DELETE: "client:delete",
  ACTIVITY_LOG_READ: "activity_log:read",
  USER_MANAGE: "user:manage",
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.ACTIVITY_LOG_READ,
  ],
  STAFF: [PERMISSIONS.PROJECT_READ, PERMISSIONS.CLIENT_READ],
};
