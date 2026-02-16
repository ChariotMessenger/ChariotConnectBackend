import { Response, NextFunction } from 'express';
import { rbacService } from '../services/rbac.service';
import { AuthRequest } from '../types';

export const requirePermissions = (...requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const hasAllPermissions = await rbacService.checkPermissions(req.user.id, requiredPermissions);

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: requiredPermissions,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Permission check failed' });
    }
  };
};

export const requireAnyPermission = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const hasAnyPermission = requiredPermissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: requiredPermissions,
      });
    }

    next();
  };
};

export const requireRole = (requiredRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const roleHierarchy: Record<string, number> = {
      SUPER_ADMIN: 3,
      ADMIN: 2,
      STAFF: 1,
    };

    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        error: `${requiredRole} role required`,
      });
    }

    next();
  };
};

export const requireRoles = (...requiredRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient role',
        required: requiredRoles,
      });
    }

    next();
  };
};
