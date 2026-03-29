import { Response } from "express";
import { orderService } from "../services/order.service";
import { getCurrencyByIP } from "../utils/goelocationCurrency";
import { AuthRequest } from "../middlewares/auth";
import { CustomError } from "../middlewares/errorHandler";

export class OrderController {
  static async createOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new CustomError("Authentication required", 401, "AUTH_REQUIRED");
      }

      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "";
      const currency = await getCurrencyByIP(ip.split(",")[0].trim());

      const result = await orderService.createOrder({
        ...req.body,
        customerId: req.user.id,
        email: req.user.email,
        currency,
      });

      res.status(201).json({ success: true, ...result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode,
      });
    }
  }

  static async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const { reference } = req.query;
      const result = await orderService.verifyPayment(reference as string);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
