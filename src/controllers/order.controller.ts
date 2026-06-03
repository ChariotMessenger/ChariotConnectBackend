import { Response } from "express";
import { OrderService } from "../services/order.service";
import { AuthRequest } from "../middlewares/auth";

export class OrderController {
  static async createOrder(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.createOrder({
        ...req.body,
        customerId: req.user!.id,
      });
      res.status(201).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async updateOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.updateOrder(
        orderId,
        req.user!.id,
        req.body,
      );
      res.status(200).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async customerCancelOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.customerCancelOrder(
        orderId,
        req.user!.id,
      );
      res.status(200).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }
  static async vendorRejectOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.vendorRejectOrder(orderId, req.user!.id);
      res.status(200).json({ success: true, order });
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

  static async vendorPackOrder(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.vendorPackOrder(
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

  static async initiatePayment(req: AuthRequest, res: Response) {
    try {
      const result = await OrderService.initializePayment(
        req.body.orderId,
        req.user!.email,
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

  static async riderUndoJob(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.riderUndoJob(
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

  static async vendorVerifyRiderKey(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.vendorVerifyRiderKey(
        req.params.orderId,
        req.user!.id,
        req.body.secretKey,
      );
      res.status(200).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async riderVerifyCustomerKeyAndDeliver(
    req: AuthRequest,
    res: Response,
  ) {
    try {
      const order = await OrderService.riderVerifyCustomerKeyAndDeliver(
        req.body.orderId,
        req.user!.id,
        req.body.secretKey,
      );
      res.status(200).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async updateRiderLocation(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.updateRiderLocation(
        req.params.orderId,
        req.user!.id,
        req.body.locationData,
      );
      res.status(200).json({ success: true, order });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }
}
