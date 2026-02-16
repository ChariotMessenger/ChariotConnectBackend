import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';

export const logActivity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (data: any) {
    if (req.user && req.method !== 'GET') {
      const resourceMatch = req.path.match(/\/api\/(\w+)\//);
      const resource = resourceMatch ? resourceMatch[1] : 'unknown';
      const resourceId = req.params.id;

      prisma.activityLog
        .create({
          data: {
            userId: req.user.id,
            action: req.method,
            resource,
            resourceId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        })
        .catch((err) => console.error('Activity log error:', err));
    }

    return originalJson.call(this, data);
  };

  next();
};
