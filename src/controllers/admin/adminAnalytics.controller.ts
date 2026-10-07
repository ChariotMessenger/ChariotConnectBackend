import { Request, Response } from "express";
import { AdminAnalyticsService } from "../../services/admin/adminAnalytics,service";
import { OrderStatus } from "@prisma/client";

export class AdminAnalyticsController {
  public static async getStats(req: Request, res: Response) {
    try {
      const stats = await AdminAnalyticsService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getActivities(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as OrderStatus;

      const data = await AdminAnalyticsService.getRecentActivities({
        page,
        limit,
        search,
        status,
      });

      res.status(200).json({ success: true, ...data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
