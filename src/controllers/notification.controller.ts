import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { notificationService } from "../services/notifications.service";

export const NotificationController = {
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const userRole = req.user?.userType as "CUSTOMER" | "VENDOR" | "RIDER";
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await notificationService.getNotifications(
        userId,
        userRole,
        limit,
        offset,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const { notificationId } = req.params;

      const result = await notificationService.markAsRead(
        notificationId,
        userId,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === "Notification not found") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === "Unauthorized to access this notification") {
        return res.status(403).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id as string;
      const userRole = req.user?.userType as "CUSTOMER" | "VENDOR" | "RIDER";

      const result = await notificationService.markAllAsRead(userId, userRole);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
};
