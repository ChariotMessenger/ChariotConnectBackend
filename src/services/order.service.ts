import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";
import { emitToUser, emitToOrderRoom, emitToAllRiders } from "../config/socket";
import crypto from "crypto";
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
  deliveryLocation: any;
  estDeliveryTime: string;
  notes?: string;
}

interface UpdateOrderInput {
  packsList?: PackGroup[];
  deliveryLocation?: any;
  notes?: string;
  estDeliveryTime?: string;
}

export class OrderService {
  private static calculateProductPrice(packsList: PackGroup[]): number {
    return packsList.reduce((total, pack) => {
      const packSum = (pack.itemList || []).reduce((packTotal, item) => {
        return packTotal + item.price * item.quantity;
      }, 0);
      return total + packSum;
    }, 0);
  }

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

      const calculatedProductPrice = this.calculateProductPrice(data.packsList);

      const pricingConfig = await prisma.pricingConfiguration.findFirst({
        orderBy: { updatedAt: "desc" },
      });

      if (!pricingConfig) {
        throw new CustomError(
          "System pricing configuration missing",
          500,
          "CONFIG_ERROR",
        );
      }

      const orderProtectionFee = pricingConfig.orderProtectionFee;
      const orderProcessingFee = pricingConfig.orderProcessingFee;
      const systemDeliveryFee = pricingConfig.deliveryCut;

      const totalAmountToPay =
        calculatedProductPrice + systemDeliveryFee + orderProtectionFee;
      const vendorNet = calculatedProductPrice - orderProcessingFee;

      const customerSecretKey = crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();
      const riderSecretKey = crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();

      const order = await prisma.order.create({
        data: {
          vendorId: data.vendorId,
          customerId: data.customerId,
          items: data.packsList as any,
          totalAmount: totalAmountToPay,
          currency: vendor.currency,
          notes: data.notes,
          status: OrderStatus.WAITING_FOR_APPROVAL,
          deliveryLocation: data.deliveryLocation,
          pickupLocation: vendor.businessAddress as any,
          estDeliveryTime: data.estDeliveryTime,
          customerSecretKey,
          riderSecretKey,
          productPrice: calculatedProductPrice,
          deliveryFee: systemDeliveryFee,
          protectionFee: orderProtectionFee,
          vendorMaintenanceFee: orderProcessingFee,
          vendorNet: vendorNet,
          settlementStatus: "PENDING",
          payoutStatus: "PENDING",
        },
      });

      logger.info(`Order created successfully with grouped packs: ${order.id}`);
      emitToUser(data.vendorId, "order:new-incoming", order);

      try {
        const itemCount = data.packsList.reduce(
          (sum, pack) => sum + (pack.itemList?.length || 0),
          0,
        );
        const systemMessageContent = `Hello! I just placed a new order containing ${itemCount} items (${order.currency} ${order.totalAmount.toLocaleString()}). Please review and approve it.`;

        const room = await prisma.messageRoom.upsert({
          where: {
            customerId_vendorId: {
              customerId: data.customerId,
              vendorId: data.vendorId,
            },
          },
          update: {},
          create: {
            customerId: data.customerId,
            vendorId: data.vendorId,
          },
        });

        const message = await prisma.message.create({
          data: {
            roomId: room.id,
            senderId: data.customerId,
            senderType: "CUSTOMER",
            content: systemMessageContent,
            sentByAi: false,
            isRead: false,
            sentAt: new Date(),
            orderId: order.id,
          },
        });

        emitToUser(data.vendorId, "message:received", message);
      } catch (msgError) {
        logger.error(
          "Failed to send order initialization chat message:",
          msgError,
        );
      }

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

      const updatedProductPrice = data.packsList
        ? this.calculateProductPrice(data.packsList)
        : order.productPrice;

      const pricingConfig = await prisma.pricingConfiguration.findFirst({
        orderBy: { updatedAt: "desc" },
      });

      const protectionFee = pricingConfig
        ? pricingConfig.orderProtectionFee
        : order.protectionFee;
      const processingFee = pricingConfig
        ? pricingConfig.orderProcessingFee
        : order.vendorMaintenanceFee;
      const deliveryFee = pricingConfig
        ? pricingConfig.deliveryCut
        : order.deliveryFee;

      const totalAmountToPay =
        updatedProductPrice + deliveryFee + protectionFee;
      const vendorNet = updatedProductPrice - processingFee;

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          items: data.packsList ? (data.packsList as any) : undefined,
          productPrice: updatedProductPrice,
          deliveryFee: deliveryFee,
          protectionFee: protectionFee,
          vendorMaintenanceFee: processingFee,
          vendorNet: vendorNet,
          totalAmount: totalAmountToPay,
          deliveryLocation: data.deliveryLocation || undefined,
          notes: data.notes || undefined,
          estDeliveryTime: data.estDeliveryTime || undefined,
        },
      });

      logger.info(`Order updated successfully by customer: ${orderId}`);
      emitToUser(updatedOrder.vendorId, "order:modified", updatedOrder);
      emitToOrderRoom(orderId, "order:updated", updatedOrder);
      return updatedOrder;
    } catch (error) {
      logger.error("Error updating order:", error);
      throw error;
    }
  }

  static async customerCancelOrder(orderId: string, customerId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new CustomError("Order not found", 404, "ORDER_NOT_FOUND");
      }

      if (order.customerId !== customerId) {
        throw new CustomError(
          "Only the customer can cancel this order",
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
          `Cannot cancel order from status ${order.status}`,
          400,
          "INVALID_STATUS",
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      emitToUser(order.vendorId, "order:status-changed", updatedOrder);
      emitToOrderRoom(orderId, "order:updated", updatedOrder);
      return updatedOrder;
    } catch (error) {
      logger.error("Error cancelling order:", error);
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
    if (!order) {
      throw new CustomError(
        "Unauthorized or not found",
        404,
        "ORDER_NOT_FOUND",
      );
    }

    const allowedVendorTransitions: OrderStatus[] = [
      OrderStatus.WAITING_FOR_APPROVAL,
      OrderStatus.AWAITING_PAYMENT,
    ];

    if (!allowedVendorTransitions.includes(order.status)) {
      throw new CustomError(
        `Vendor cannot change status when order is ${order.status}`,
        400,
        "INVALID_STATUS",
      );
    }

    if (
      status !== OrderStatus.AWAITING_PAYMENT &&
      status !== OrderStatus.REJECTED
    ) {
      throw new CustomError(
        "Vendor can only action order to AWAITING_PAYMENT or REJECTED from here",
        400,
        "INVALID_STATUS",
      );
    }

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

  static async vendorPackOrder(orderId: string, vendorId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: { id: orderId, vendorId },
      });

      if (!order) {
        throw new CustomError(
          "Order not found or unauthorized",
          404,
          "ORDER_NOT_FOUND",
        );
      }

      if (order.status !== OrderStatus.PAID) {
        throw new CustomError(
          "Order must be PAID before packing",
          400,
          "INVALID_STATUS",
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ORDER_PACKED },
      });

      emitToUser(order.customerId, "order:status-changed", updatedOrder);
      emitToOrderRoom(orderId, "order:updated", updatedOrder);
      emitToAllRiders("delivery-job:available", updatedOrder);

      return updatedOrder;
    } catch (error) {
      logger.error("Error packing order:", error);
      throw error;
    }
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

      return [transaction, order];
    }
    throw new CustomError("Payment not verified", 400, "PAYMENT_FAILED");
  }

  static async riderAcceptJob(orderId: string, riderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new CustomError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    if (order.status !== OrderStatus.ORDER_PACKED) {
      throw new CustomError(
        "Riders can only fetch jobs from ORDER_PACKED status",
        400,
        "INVALID_STATUS",
      );
    }

    const pricingConfig = await prisma.pricingConfiguration.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    const deliveryCut = pricingConfig ? pricingConfig.deliveryCut : 20.0;
    const riderMaintenanceFee = deliveryCut;
    const riderAmountToReceive = order.deliveryFee - riderMaintenanceFee;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        riderId,
        status: OrderStatus.RIDER_EN_ROUTE_TO_VENDOR,
        riderMaintenanceFee,
        riderNet: riderAmountToReceive,
      },
    });

    emitToUser(updatedOrder.customerId, "order:rider-assigned", updatedOrder);
    emitToUser(updatedOrder.vendorId, "order:rider-assigned", updatedOrder);
    emitToOrderRoom(orderId, "order:updated", updatedOrder);

    return updatedOrder;
  }

  static async riderUndoJob(orderId: string, riderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new CustomError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    if (order.riderId !== riderId) {
      throw new CustomError(
        "Unauthorized to undo this job",
        403,
        "UNAUTHORIZED",
      );
    }

    if (order.status !== OrderStatus.RIDER_EN_ROUTE_TO_VENDOR) {
      throw new CustomError(
        "Cannot undo job after vendor verification or status progression",
        400,
        "UNDO_NOT_ALLOWED",
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: null,
        status: OrderStatus.ORDER_PACKED,
        riderMaintenanceFee: 0,
        riderNet: 0,
      },
    });

    emitToUser(updatedOrder.customerId, "order:rider-unassigned", updatedOrder);
    emitToUser(updatedOrder.vendorId, "order:rider-unassigned", updatedOrder);
    emitToOrderRoom(orderId, "order:updated", updatedOrder);
    emitToAllRiders("delivery-job:available", updatedOrder);

    return updatedOrder;
  }

  static async vendorVerifyRiderKey(
    orderId: string,
    vendorId: string,
    secretKey: string,
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, vendorId },
    });

    if (!order) {
      throw new CustomError(
        "Order not found or unauthorized",
        404,
        "ORDER_NOT_FOUND",
      );
    }

    if (order.status !== OrderStatus.RIDER_EN_ROUTE_TO_VENDOR) {
      throw new CustomError(
        "Order status must be RIDER_EN_ROUTE_TO_VENDOR to perform this key verification",
        400,
        "INVALID_STATUS",
      );
    }

    if (order.riderSecretKey !== secretKey) {
      throw new CustomError(
        "Invalid rider secret key verification failed",
        400,
        "INVALID_KEY",
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.RIDER_EN_ROUTE_TO_CUSTOMER,
        pickupAt: new Date(),
      },
    });

    emitToUser(updatedOrder.customerId, "order:en-route", updatedOrder);
    emitToOrderRoom(orderId, "order:updated", updatedOrder);

    return updatedOrder;
  }

  static async riderVerifyCustomerKeyAndDeliver(
    orderId: string,
    riderId: string,
    secretKey: string,
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, riderId },
    });

    if (!order) {
      throw new CustomError(
        "Order not found or unauthorized rider access",
        404,
        "ORDER_NOT_FOUND",
      );
    }

    if (order.status !== OrderStatus.RIDER_EN_ROUTE_TO_CUSTOMER) {
      throw new CustomError(
        "Order status must be RIDER_EN_ROUTE_TO_CUSTOMER to perform final delivery verification",
        400,
        "INVALID_STATUS",
      );
    }

    if (order.customerSecretKey !== secretKey) {
      throw new CustomError(
        "Invalid customer secret key verification failed",
        400,
        "INVALID_KEY",
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
    });

    emitToUser(updatedOrder.customerId, "order:delivered", updatedOrder);
    emitToUser(updatedOrder.vendorId, "order:delivered", updatedOrder);
    emitToOrderRoom(orderId, "order:updated", updatedOrder);

    return updatedOrder;
  }

  static async updateRiderLocation(
    orderId: string,
    riderId: string,
    locationData: any,
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, riderId },
    });

    if (!order) {
      throw new CustomError(
        "Active order assignment context not found for this rider identity",
        404,
        "ORDER_NOT_FOUND",
      );
    }

    const nonActiveStatuses: OrderStatus[] = [
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REJECTED,
    ];

    if (nonActiveStatuses.includes(order.status)) {
      throw new CustomError(
        "Cannot process active location streams on a closed terminal order node instance",
        400,
        "ORDER_INACTIVE",
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        riderLocation: locationData,
      },
    });

    emitToOrderRoom(orderId, "rider:location-updated", updatedOrder);
    return updatedOrder;
  }
}
