import { Request, Response } from "express";
import { getDashboardStats } from "../../services/admin/admin.dashboard.service";

export class DashboardController {
  async getStats(req: Request, res: Response) {
    try {
      const stats = await getDashboardStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch dashboard statistics",
      });
    }
  }
}
