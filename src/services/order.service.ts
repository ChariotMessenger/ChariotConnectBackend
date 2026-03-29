import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";
import EmailService from "./email.service";
import axios from "axios";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export class OrderService {
  static async createOrder(data: {
    vendorId: string;
    customerId: string;
    items: any[];
    totalAmount: number;
    currency: string;
    email: string;
    notes?: string;
  }) {
    try {
      const order = await prisma.order.create({
        data: {
          vendorId: data.vendorId,
          customerId: data.customerId,
          items: JSON.stringify(data.items),
          totalAmount: data.totalAmount,
          currency: data.currency,
          notes: data.notes,
          status: OrderStatus.PENDING,
        },
      });

      logger.info(`Order created: ${order.id}`);

      const paystackResponse = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: data.email,
          amount: Math.round(data.totalAmount * 100),
          currency: data.currency,
          metadata: { orderId: order.id },
          callback_url: `${process.env.APP_URL}/api/orders/payment/callback`,
        },
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
      );

      const { reference, authorization_url } = paystackResponse.data.data;

      await prisma.transaction.create({
        data: {
          orderId: order.id,
          reference: reference,
          amount: data.totalAmount,
          currency: data.currency,
          status: PaymentStatus.PENDING,
        },
      });

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

      return { order, paymentLink: authorization_url, reference };
    } catch (error) {
      logger.error("Error creating order:", error);
      throw error;
    }
  }

  static async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
      );

      const { status, metadata } = response.data.data;

      if (status === "success") {
        await prisma.$transaction([
          prisma.transaction.update({
            where: { reference },
            data: { status: PaymentStatus.SUCCESS },
          }),
          prisma.order.update({
            where: { id: metadata.orderId },
            data: { status: OrderStatus.ACCEPTED },
          }),
        ]);
        return { status: "success", orderId: metadata.orderId };
      }

      return { status: "failed" };
    } catch (error) {
      logger.error("Error verifying payment:", error);
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
            select: { id: true, businessName: true, phone: true },
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
        where: { vendorId, ...(status && { status }) },
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
        where: { customerId, ...(status && { status }) },
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            select: { id: true, businessName: true, phone: true },
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
