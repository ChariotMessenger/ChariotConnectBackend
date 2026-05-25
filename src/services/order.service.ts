import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";
import { emitToUser, emitToOrderRoom, emitToAllRiders } from "../config/socket";
import axios from "axios";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAWAPAY_SECRET = process.env.PAWAPAY_SECRET_KEY;

export interface ItemDetails {
  productId: string;
  itemName: string;
  productImageUrl: string | null;
  price: number;
  quantity: number;
  description: string | null;
}

export interface PackGroup {
  packLabel: string;
  itemList: ItemDetails[];
}

interface CreateOrderInput {
  vendorId: string;
  customerId: string;
  packsList: PackGroup[];
  totalAmount: number;
  deliveryLocation: any;
  notes?: string;
}

interface UpdateOrderInput {
  packsList?: PackGroup[];
  totalAmount?: number;
  deliveryLocation?: any;
  notes?: string;
}

export class OrderService {
  static async createOrder(data: CreateOrderInput) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: data.vendorId },
        select: {
          currency: true,
          businessAddress: true,
        },
      });

      if (!vendor) {
        throw new CustomError("Vendor not found", 404, "VENDOR_NOT_FOUND");
      }

      if (!data.packsList || data.packsList.length === 0) {
        throw new CustomError(
          "Order must contain at least one pack list entry",
          400,
          "INVALID_ITEMS",
        );
      }

      const order = await prisma.order.create({
        data: {
          vendorId: data.vendorId,
          customerId: data.customerId,
          items: data.packsList as any,
          totalAmount: data.totalAmount,
          currency: vendor.currency,
          notes: data.notes,
          status: OrderStatus.WAITING_FOR_APPROVAL,
          deliveryLocation: data.deliveryLocation,
          pickupLocation: vendor.businessAddress as any,
        },
      });

      logger.info(`Order created successfully with grouped packs: ${order.id}`);
      emitToUser(data.vendorId, "order:new-incoming", order);
      return order;
    } catch (error) {
      logger.error("Error creating order with packs list:", error);
      throw error;
    }
  }

  static async updateOrder(
    orderId: string,
    customerId: string,
    data: UpdateOrderInput,
  ) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          customerId: true,
          vendorId: true,
          status: true,
        },
      });

      if (!order) {
        throw new CustomError("Order not found", 404, "ORDER_NOT_FOUND");
      }

      if (order.customerId !== customerId) {
        throw new CustomError(
          "Unauthorized to update this order",
          403,
          "UNAUTHORIZED",
        );
      }

      const allowedStatuses: OrderStatus[] = [
        OrderStatus.WAITING_FOR_APPROVAL,
        OrderStatus.AWAITING_PAYMENT,
      ];

      if (!allowedStatuses.includes(order.status)) {
        throw new CustomError(
          `Cannot update order because it is already ${order.status}`,
          400,
          "ORDER_ALREADY_PROCESSED",
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          items: data.packsList ? (data.packsList as any) : undefined,
          totalAmount:
            data.totalAmount !== undefined ? data.totalAmount : undefined,
          deliveryLocation: data.deliveryLocation || undefined,
          notes: data.notes || undefined,
        },
      });

      logger.info(`Order updated successfully by customer: ${orderId}`);
      emitToUser(order.vendorId, "order:modified", updatedOrder);
      emitToOrderRoom(orderId, "order:updated", updatedOrder);
      return updatedOrder;
    } catch (error) {
      logger.error("Error updating order:", error);
      throw error;
    }
  }

  static async vendorUpdateStatus(
    orderId: string,
    vendorId: string,
    status: OrderStatus,
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, vendorId },
    });
    if (!order)
      throw new CustomError(
        "Unauthorized or not found",
        404,
        "ORDER_NOT_FOUND",
      );

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    emitToUser(order.customerId, "order:status-changed", updatedOrder);
    emitToOrderRoom(orderId, "order:updated", updatedOrder);

    if (status === OrderStatus.AWAITING_PAYMENT) {
      emitToUser(order.customerId, "order:ready-for-payment", updatedOrder);
    }

    return updatedOrder;
  }

  static async initializePayment(orderId: string, email: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: { phone: true },
        },
      },
    });

    if (!order || order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new CustomError(
        "Order not ready for payment",
        400,
        "INVALID_STATUS",
      );
    }

    const customerPhone = order.customer?.phone;
    const currency = order.currency;

    if (currency === "RWF") {
      if (!customerPhone) {
        throw new CustomError(
          "Customer phone number not found in profile. Required for RWF payments.",
          400,
          "PHONE_REQUIRED",
        );
      }

      const response = await axios.post(
        "https://api.pawapay.cloud/deposits",
        {
          depositId: orderId,
          amount: order.totalAmount.toString(),
          currency: "RWF",
          correspondent: "MTN_MOMO_RWA",
          payer: { address: { value: customerPhone } },
          customerTimestamp: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${PAWAPAY_SECRET}` } },
      );

      await prisma.transaction.create({
        data: {
          orderId,
          reference: response.data.depositId,
          amount: order.totalAmount,
          currency: "RWF",
          provider: "PAWAPAY",
        },
      });

      return { provider: "PAWAPAY", data: response.data };
    } else {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: Math.round(order.totalAmount * 100),
          currency: currency || "NGN",
          metadata: { orderId },
        },
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
      );

      await prisma.transaction.create({
        data: {
          orderId,
          reference: response.data.data.reference,
          amount: order.totalAmount,
          currency: currency || "NGN",
          provider: "PAYSTACK",
        },
      });

      return {
        provider: "PAYSTACK",
        url: response.data.data.authorization_url,
      };
    }
  }

  static async verifyPayment(reference: string, provider: string) {
    let isPaid = false;
    let orderId = "";

    if (provider === "PAYSTACK") {
      const res = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } },
      );
      if (res.data.data.status === "success") {
        isPaid = true;
        orderId = res.data.data.metadata.orderId;
      }
    } else {
      const res = await axios.get(
        `https://api.pawapay.cloud/deposits/${reference}`,
        { headers: { Authorization: `Bearer ${PAWAPAY_SECRET}` } },
      );
      if (res.data.status === "COMPLETED") {
        isPaid = true;
        orderId = reference;
      }
    }

    if (isPaid) {
      const [transaction, order] = await prisma.$transaction([
        prisma.transaction.update({
          where: { reference },
          data: { status: PaymentStatus.SUCCESS },
        }),
        prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID },
        }),
      ]);

      emitToUser(order.vendorId, "order:payment-received", order);
      emitToOrderRoom(orderId, "order:updated", order);
      emitToAllRiders("delivery-job:available", order);

      return [transaction, order];
    }
    throw new CustomError("Payment not verified", 400, "PAYMENT_FAILED");
  }

  static async riderAcceptJob(orderId: string, riderId: string) {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { riderId, status: OrderStatus.RIDER_ACCEPTED },
    });

    emitToUser(updatedOrder.customerId, "order:rider-assigned", updatedOrder);
    emitToUser(updatedOrder.vendorId, "order:rider-assigned", updatedOrder);
    emitToOrderRoom(orderId, "order:updated", updatedOrder);

    return updatedOrder;
  }

  static async riderConfirmPickup(orderId: string, riderId: string) {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId, riderId },
      data: {
        status: OrderStatus.RIDER_EN_ROUTE_TO_CUSTOMER,
        pickupAt: new Date(),
      },
    });

    emitToUser(updatedOrder.customerId, "order:en-route", updatedOrder);
    emitToOrderRoom(orderId, "order:updated", updatedOrder);

    return updatedOrder;
  }

  static async riderFinalizeDelivery(orderId: string, riderId: string) {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId, riderId },
      data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
    });

    emitToUser(updatedOrder.customerId, "order:delivered", updatedOrder);
    emitToUser(updatedOrder.vendorId, "order:delivered", updatedOrder);
    emitToOrderRoom(orderId, "order:updated", updatedOrder);

    return updatedOrder;
  }
}
