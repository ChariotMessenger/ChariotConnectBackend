import { Request, Response, NextFunction } from "express";
import { RiderMetricsService } from "../services/rider.metrics.service";

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export class RiderMetricsController {
  static async getTodayStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const riderId = authReq.user!.id;
      const stats = await RiderMetricsService.getRiderTodayStats(riderId);

      res.status(200).json({
        success: true,
        message: "Today's metrics fetched successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
