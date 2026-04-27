import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";
import axios from "axios";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAWAPAY_SECRET = process.env.PAWAPAY_SECRET_KEY;

export class OrderService {
  static async createOrder(data: {
    vendorId: string;
    customerId: string;
    items: any;
    totalAmount: number;
    deliveryLocation: any;
    notes?: string;
  }) {
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

    return await prisma.order.create({
      data: {
        vendorId: data.vendorId,
        customerId: data.customerId,
        items: data.items,
        totalAmount: data.totalAmount,
        currency: vendor.currency,
        notes: data.notes,
        status: OrderStatus.WAITING_FOR_APPROVAL,
        deliveryLocation: data.deliveryLocation,
        pickupLocation: vendor.businessAddress as any,
      },
    });
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

    return await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
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
      return await prisma.$transaction([
        prisma.transaction.update({
          where: { reference },
          data: { status: PaymentStatus.SUCCESS },
        }),
        prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID },
        }),
      ]);
    }
    throw new CustomError("Payment not verified", 400, "PAYMENT_FAILED");
  }

  static async riderAcceptJob(orderId: string, riderId: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { riderId, status: OrderStatus.RIDER_ACCEPTED },
    });
  }

  static async riderConfirmPickup(orderId: string, riderId: string) {
    return await prisma.order.update({
      where: { id: orderId, riderId },
      data: {
        status: OrderStatus.RIDER_EN_ROUTE_TO_CUSTOMER,
        pickupAt: new Date(),
      },
    });
  }

  static async riderFinalizeDelivery(orderId: string, riderId: string) {
    return await prisma.order.update({
      where: { id: orderId, riderId },
      data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
    });
  }
}
