import { Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";
import { UserType } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth";

export class NotificationController {
  static async registerToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user!.id;
      const { token, userType } = req.body;

      await NotificationService.registerDeviceToken(
        userId,
        userType as UserType,
        token,
      );

      res.status(200).json({
        success: true,
        message: "Device cloud token registered successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
