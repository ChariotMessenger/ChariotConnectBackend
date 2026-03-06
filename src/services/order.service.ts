import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { OrderStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";
import EmailService from "./email.service";

export class OrderService {
  static async createOrder(data: {
    vendorId: string;
    customerId: string;
    items: any[];
    totalAmount: number;
    notes?: string;
  }) {
    try {
      const order = await prisma.order.create({
        data: {
          vendorId: data.vendorId,
          customerId: data.customerId,
          items: JSON.stringify(data.items),
          totalAmount: data.totalAmount,
          notes: data.notes,
          status: OrderStatus.PENDING,
        },
      });

      logger.info(`Order created: ${order.id}`);

      // Send notification to vendor
      const vendor = await prisma.vendor.findUnique({
        where: { id: data.vendorId },
      });

      if (vendor) {
        await EmailService.sendOrderNotificationEmail(vendor.email, {
          orderId: order.id,
          amount: data.totalAmount,
          status: order.status,
        });
      }

      return order;
    } catch (error) {
      logger.error("Error creating order:", error);
      throw error;
    }
  }

  static async acceptOrder(orderId: string, vendorId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.vendorId !== vendorId) {
        throw new CustomError(
          "Order not found or unauthorized",
          404,
          "ORDER_NOT_FOUND",
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ACCEPTED },
      });

      logger.info(`Order accepted: ${orderId}`);
      return updatedOrder;
    } catch (error) {
      logger.error("Error accepting order:", error);
      throw error;
    }
  }

  static async rejectOrder(orderId: string, vendorId: string, reason?: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.vendorId !== vendorId) {
        throw new CustomError(
          "Order not found or unauthorized",
          404,
          "ORDER_NOT_FOUND",
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.REJECTED,
          notes: reason || order.notes,
        },
      });

      logger.info(`Order rejected: ${orderId}`);
      return updatedOrder;
    } catch (error) {
      logger.error("Error rejecting order:", error);
      throw error;
    }
  }

  static async completeOrder(orderId: string, vendorId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.vendorId !== vendorId) {
        throw new CustomError(
          "Order not found or unauthorized",
          404,
          "ORDER_NOT_FOUND",
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      logger.info(`Order completed: ${orderId}`);
      return updatedOrder;
    } catch (error) {
      logger.error("Error completing order:", error);
      throw error;
    }
  }

  static async cancelOrder(orderId: string, customerId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.customerId !== customerId) {
        throw new CustomError(
          "Order not found or unauthorized",
          404,
          "ORDER_NOT_FOUND",
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      logger.info(`Order cancelled: ${orderId}`);
      return updatedOrder;
    } catch (error) {
      logger.error("Error cancelling order:", error);
      throw error;
    }
  }

  static async getOrder(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              phone: true,
            },
          },
        },
      });

      if (!order) {
        throw new CustomError("Order not found", 404, "ORDER_NOT_FOUND");
      }

      return {
        ...order,
        items: JSON.parse(order.items),
      };
    } catch (error) {
      logger.error("Error fetching order:", error);
      throw error;
    }
  }

  static async getVendorOrders(vendorId: string, status?: OrderStatus) {
    try {
      const orders = await prisma.order.findMany({
        where: {
          vendorId,
          ...(status && { status }),
        },
        orderBy: { createdAt: "desc" },
      });

      return orders.map((order) => ({
        ...order,
        items: JSON.parse(order.items),
      }));
    } catch (error) {
      logger.error("Error fetching vendor orders:", error);
      throw error;
    }
  }

  static async getCustomerOrders(customerId: string, status?: OrderStatus) {
    try {
      const orders = await prisma.order.findMany({
        where: {
          customerId,
          ...(status && { status }),
        },
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              phone: true,
            },
          },
        },
      });

      return orders.map((order) => ({
        ...order,
        items: JSON.parse(order.items),
      }));
    } catch (error) {
      logger.error("Error fetching customer orders:", error);
      throw error;
    }
  }
}

export const orderService = OrderService;
