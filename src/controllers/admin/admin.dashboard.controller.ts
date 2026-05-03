import { Request, Response } from "express";
import { AdminService } from "../../services/admin/admin.dashboard.service";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export class DashboardController {
  async getStats(req: Request, res: Response) {
    try {
      const stats = await AdminService.getDashboardStats();
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

  async getTransactions(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as PaymentStatus;

      const data = await AdminService.getTransactions(page, limit, status);
      return res.status(200).json({
        success: true,
        ...data,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch transactions",
      });
    }
  }

  async getTransactionDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const detail = await AdminService.getTransactionDetail(id);

      if (!detail) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch transaction details",
      });
    }
  }

  async getOrders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as OrderStatus;

      const orders = await AdminService.getOrders(page, limit, status);
      return res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch orders",
      });
    }
  }

  async getOrderDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const detail = await AdminService.getOrderDetail(id);

      if (!detail) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch order details",
      });
    }
  }

  async updatePricing(req: Request, res: Response) {
    try {
      const config = await AdminService.updatePricing(req.body);
      return res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update pricing configuration",
      });
    }
  }
}
