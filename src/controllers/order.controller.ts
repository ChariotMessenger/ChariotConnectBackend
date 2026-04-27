import { Response } from "express";
import { OrderService } from "../services/order.service";
import { getCurrencyByIP } from "../utils/goelocationCurrency";
import { AuthRequest } from "../middlewares/auth";

export class OrderController {
  static async createOrder(req: AuthRequest, res: Response) {
    try {
      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "";
      const currency = await getCurrencyByIP(ip.split(",")[0].trim());
      const order = await OrderService.createOrder({
        ...req.body,
        customerId: req.user!.id,
        currency,
      });
      res.status(201).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async vendorUpdateStatus(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.vendorUpdateStatus(
        req.params.orderId,
        req.user!.id,
        req.body.status,
      );
      res.status(200).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async initiatePayment(req: AuthRequest, res: Response) {
    try {
      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "";
      const currency = await getCurrencyByIP(ip.split(",")[0].trim());
      const result = await OrderService.initializePayment(
        req.body.orderId,
        req.user!.email,
        currency,
        req.body.phone,
      );
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const { reference, provider } = req.query;
      const result = await OrderService.verifyPayment(
        reference as string,
        provider as string,
      );
      res.status(200).json({ success: true, order: result[1] });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async riderAccept(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.riderAcceptJob(
        req.params.orderId,
        req.user!.id,
      );
      res.status(200).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async riderPickup(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.riderConfirmPickup(
        req.params.orderId,
        req.user!.id,
      );
      res.status(200).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async riderDeliver(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.riderFinalizeDelivery(
        req.body.orderId,
        req.user!.id,
      );
      res.status(200).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }
}
