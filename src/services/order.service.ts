import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { OrderStatus, PaymentStatus, UserType } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";
import { emitToUser, emitToOrderRoom, emitToAllRiders } from "../config/socket";
import { NotificationService } from "./notification.service";
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
  private static orderIncludeOptions = {
    vendor: {
      select: {
        id: true,
        businessName: true,
        phone: true,
        brandLogoUrl: true,
        coverPhotoUrl: true,
        currency: true,
        businessAddress: true,
      },
    },
    customer: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        profilePhotoUrl: true,
      },
    },
    rider: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        profilePhotoUrl: true,
      },
    },
  };

  private static calculateProductPrice(packsList: PackGroup[]): number {
    return packsList.reduce((total, pack) => {
      const packSum = (pack.itemList || []).reduce((packTotal, item) => {
        return packTotal + item.price * item.quantity;
      }, 0);
      return total + packSum;
    }, 0);
  }

  private static formatOrderResponse(order: any, requestedByUserId?: string) {
    if (!order) return order;

    const isCustomer =
      requestedByUserId && order.customerId === requestedByUserId;
    const isVendor = requestedByUserId && order.vendorId === requestedByUserId;
    const isRider = requestedByUserId && order.riderId === requestedByUserId;

    const formatted: Record<string, any> = {
      id: order.id,
      currency: order.currency,
      status: order.status,
      notes: order.notes || "",
      deliveryLocation: order.deliveryLocation || {},
      pickupLocation: order.pickupLocation || {},
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      estDeliveryTime: order.estDeliveryTime || "",
      riderSecretKey: order.riderSecretKey,
      customerSecretKey: order.customerSecretKey,
      vendorNet: order.vendorNet,
      settlementStatus: order.settlementStatus || "PENDING",
      payoutStatus: order.payoutStatus || "PENDING",
      pickupAt: order.pickupAt || null,
      deliveredAt: order.deliveredAt || null,
      productPrice: order.productPrice,
      packsList: (order.items as unknown as PackGroup[]) || [],
    };

    if (order.vendor) {
      formatted.vendor = {
        vendorId: order.vendor.id,
        businessName: order.vendor.businessName || "",
        phone: !isCustomer ? order.vendor.phoneNumber || "" : undefined,
        brandLogoUrl: order.vendor.brandLogoUrl || "",
        coverPhotoUrl: order.vendor.coverPhotoUrl || "",
        vendorMaintenanceFee: isVendor ? order.vendorMaintenanceFee : undefined,
        totalAmountToReceive: isVendor ? order.vendorNet : undefined,
      };
    }

    if (order.customer) {
      formatted.customer = {
        customerId: order.customer.id,
        firstName: order.customer.firstName || "",
        lastName: order.customer.lastName || "",
        phone: !isVendor ? order.customer.phoneNumber || "" : undefined,
        profilePhotoUrl: order.customer.profilePhotoUrl || "",
        deliveryFee: isCustomer ? order.deliveryFee : undefined,
        protectionFee: isCustomer ? order.protectionFee : undefined,
        totalAmountToPay: isCustomer ? order.totalAmount : undefined,
      };
    }

    if (order.rider) {
      formatted.rider = {
        riderId: order.rider.id,
        firstName: order.rider.firstName || "",
        lastName: order.rider.lastName || "",
        phone: order.rider.phoneNumber || "",
        profilePhotoUrl: order.rider.profilePhotoUrl || "",
        riderMaintenanceFee: isRider ? order.riderMaintenanceFee : undefined,
        totalAmountToReceive: isRider ? order.riderNet : undefined,
        riderLocation: order.riderLocation || {},
      };
    }

    return formatted;
  }

  static async createOrder(data: CreateOrderInput) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: data.vendorId },
        select: {
          currency: true,
          businessAddress: true,
          businessName: true,
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
      const ridsKey = crypto.randomBytes(4).toString("hex").toUpperCase();

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
          riderSecretKey: ridsKey,
          productPrice: calculatedProductPrice,
          deliveryFee: systemDeliveryFee,
          protectionFee: orderProtectionFee,
          vendorMaintenanceFee: orderProcessingFee,
          vendorNet: vendorNet,
          settlementStatus: "PENDING",
          payoutStatus: "PENDING",
        },
        include: this.orderIncludeOptions,
      });

      logger.info(`Order created successfully with grouped packs: ${order.id}`);

      const formattedResponse = this.formatOrderResponse(
        order,
        data.customerId,
      );
      emitToUser(
        data.vendorId,
        "order:new-incoming",
        this.formatOrderResponse(order, data.vendorId),
      );

      NotificationService.sendPushNotification(data.vendorId, UserType.VENDOR, {
        title: "New Incoming Order",
        body: `You have received a new order from a customer. Click to view options.`,
        data: { orderId: order.id, type: "NEW_ORDER" },
      }).catch((e: any) =>
        logger.error("Push notification failing context:", e),
      );

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

      return formattedResponse;
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
        include: this.orderIncludeOptions,
      });

      logger.info(`Order updated successfully by customer: ${orderId}`);

      emitToUser(
        updatedOrder.vendorId,
        "order:modified",
        this.formatOrderResponse(updatedOrder, updatedOrder.vendorId),
      );
      emitToOrderRoom(
        orderId,
        "order:updated",
        this.formatOrderResponse(updatedOrder),
      );

      NotificationService.sendPushNotification(
        updatedOrder.vendorId,
        UserType.VENDOR,
        {
          title: "Order Modified",
          body: `The customer has updated details on order #${orderId}.`,
          data: { orderId, type: "ORDER_MODIFIED" },
        },
      ).catch((e: any) =>
        logger.error("Push notification failing context:", e),
      );

      return this.formatOrderResponse(updatedOrder, customerId);
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
        include: this.orderIncludeOptions,
      });

      emitToUser(
        order.vendorId,
        "order:status-changed",
        this.formatOrderResponse(updatedOrder, order.vendorId),
      );
      emitToOrderRoom(
        orderId,
        "order:updated",
        this.formatOrderResponse(updatedOrder),
      );

      NotificationService.sendPushNotification(
        order.vendorId,
        UserType.VENDOR,
        {
          title: "Order Cancelled",
          body: `Customer cancelled order #${orderId}.`,
          data: { orderId, status: "CANCELLED" },
        },
      ).catch((e: any) =>
        logger.error("Push notification failing context:", e),
      );

      return this.formatOrderResponse(updatedOrder, customerId);
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
      include: this.orderIncludeOptions,
    });

    emitToUser(
      order.customerId,
      "order:status-changed",
      this.formatOrderResponse(updatedOrder, order.customerId),
    );
    emitToOrderRoom(
      orderId,
      "order:updated",
      this.formatOrderResponse(updatedOrder),
    );

    if (status === OrderStatus.AWAITING_PAYMENT) {
      emitToUser(
        order.customerId,
        "order:ready-for-payment",
        this.formatOrderResponse(updatedOrder, order.customerId),
      );

      NotificationService.sendPushNotification(
        order.customerId,
        UserType.CUSTOMER,
        {
          title: "Order Approved",
          body: `Your order has been approved and is ready for payment.`,
          data: { orderId, status: "AWAITING_PAYMENT" },
        },
      ).catch((e: any) =>
        logger.error("Push notification failing context:", e),
      );
    }

    if (status === OrderStatus.REJECTED) {
      NotificationService.sendPushNotification(
        order.customerId,
        UserType.CUSTOMER,
        {
          title: "Order Declined",
          body: `The vendor declined your order execution request.`,
          data: { orderId, status: "REJECTED" },
        },
      ).catch((e: any) =>
        logger.error("Push notification failing context:", e),
      );
    }

    return this.formatOrderResponse(updatedOrder, vendorId);
  }

  static async vendorRejectOrder(orderId: string, vendorId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: { id: orderId, vendorId },
      });

      if (!order) {
        throw new CustomError(
          "Order not found or unauthorized vendor access",
          404,
          "ORDER_NOT_FOUND",
        );
      }

      const allowedStatuses: OrderStatus[] = [
        OrderStatus.WAITING_FOR_APPROVAL,
        OrderStatus.AWAITING_PAYMENT,
      ];

      if (!allowedStatuses.includes(order.status)) {
        throw new CustomError(
          `Cannot reject order because it is already ${order.status}`,
          400,
          "INVALID_STATUS",
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REJECTED },
        include: this.orderIncludeOptions,
      });

      emitToUser(
        order.customerId,
        "order:status-changed",
        this.formatOrderResponse(updatedOrder, order.customerId),
      );
      emitToOrderRoom(
        orderId,
        "order:updated",
        this.formatOrderResponse(updatedOrder),
      );

      NotificationService.sendPushNotification(
        order.customerId,
        UserType.CUSTOMER,
        {
          title: "Order Declined",
          body: `The vendor declined your order execution request.`,
          data: { orderId, status: "REJECTED" },
        },
      ).catch((e: any) =>
        logger.error("Push notification failing context:", e),
      );

      return this.formatOrderResponse(updatedOrder, vendorId);
    } catch (error) {
      logger.error("Error rejecting order by vendor:", error);
      throw error;
    }
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
        include: this.orderIncludeOptions,
      });

      emitToUser(
        order.customerId,
        "order:status-changed",
        this.formatOrderResponse(updatedOrder, order.customerId),
      );
      emitToOrderRoom(
        orderId,
        "order:updated",
        this.formatOrderResponse(updatedOrder),
      );
      emitToAllRiders(
        "delivery-job:available",
        this.formatOrderResponse(updatedOrder),
      );

      NotificationService.sendPushNotification(
        order.customerId,
        UserType.CUSTOMER,
        {
          title: "Order Packed",
          body: `Your order from ${updatedOrder.vendor?.businessName || "Vendor"} is completely packed and awaiting runner setup.`,
          data: { orderId, status: "ORDER_PACKED" },
        },
      ).catch((e: any) =>
        logger.error("Push notification failing context:", e),
      );

      return this.formatOrderResponse(updatedOrder, vendorId);
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
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { vendorId: true, vendorNet: true, currency: true },
      });

      if (!existingOrder) {
        throw new CustomError(
          "Order context not found",
          404,
          "ORDER_NOT_FOUND",
        );
      }

      const [transaction, order] = await prisma.$transaction([
        prisma.transaction.update({
          where: { reference },
          data: { status: PaymentStatus.SUCCESS },
        }),
        prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID },
          include: this.orderIncludeOptions,
        }),
        prisma.wallet.update({
          where: { vendorId: existingOrder.vendorId },
          data: { balance: { increment: existingOrder.vendorNet } },
        }),
      ]);

      emitToUser(
        order.vendorId,
        "order:payment-received",
        this.formatOrderResponse(order, order.vendorId),
      );
      emitToOrderRoom(
        orderId,
        "order:updated",
        this.formatOrderResponse(order),
      );

      NotificationService.sendPushNotification(
        order.vendorId,
        UserType.VENDOR,
        {
          title: "Payment Received",
          body: `Payment for order #${orderId} was successfully settled. Begin preparation.`,
          data: { orderId, status: "PAID" },
        },
      ).catch((e: any) =>
        logger.error("Push notification failing context:", e),
      );

      return [transaction, this.formatOrderResponse(order, order.customerId)];
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
      include: this.orderIncludeOptions,
    });

    emitToUser(
      updatedOrder.customerId,
      "order:rider-assigned",
      this.formatOrderResponse(updatedOrder, updatedOrder.customerId),
    );
    emitToUser(
      updatedOrder.vendorId,
      "order:rider-assigned",
      this.formatOrderResponse(updatedOrder, updatedOrder.vendorId),
    );
    emitToOrderRoom(
      orderId,
      "order:updated",
      this.formatOrderResponse(updatedOrder),
    );

    NotificationService.sendPushNotification(
      updatedOrder.customerId,
      UserType.CUSTOMER,
      {
        title: "Rider Heading to Vendor",
        body: `A rider has accepted the delivery match and is picking up your items.`,
        data: { orderId, status: "RIDER_EN_ROUTE_TO_VENDOR" },
      },
    ).catch((e: any) => logger.error("Push notification failing context:", e));

    NotificationService.sendPushNotification(
      updatedOrder.vendorId,
      UserType.VENDOR,
      {
        title: "Rider Dispatched",
        body: `A rider is heading to your business address to pick up order #${orderId}.`,
        data: { orderId, status: "RIDER_EN_ROUTE_TO_VENDOR" },
      },
    ).catch((e: any) => logger.error("Push notification failing context:", e));

    return this.formatOrderResponse(updatedOrder, riderId);
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
      include: this.orderIncludeOptions,
    });

    emitToUser(
      updatedOrder.customerId,
      "order:rider-unassigned",
      this.formatOrderResponse(updatedOrder, updatedOrder.customerId),
    );
    emitToUser(
      updatedOrder.vendorId,
      "order:rider-unassigned",
      this.formatOrderResponse(updatedOrder, updatedOrder.vendorId),
    );
    emitToOrderRoom(
      orderId,
      "order:updated",
      this.formatOrderResponse(updatedOrder),
    );
    emitToAllRiders(
      "delivery-job:available",
      this.formatOrderResponse(updatedOrder),
    );

    NotificationService.sendPushNotification(
      updatedOrder.vendorId,
      UserType.VENDOR,
      {
        title: "Rider Unassigned",
        body: `The assigned courier unlinked from order #${orderId}. A matching replacement search is active.`,
        data: { orderId, status: "ORDER_PACKED" },
      },
    ).catch((e: any) => logger.error("Push notification failing context:", e));

    return this.formatOrderResponse(updatedOrder, riderId);
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
      include: this.orderIncludeOptions,
    });

    emitToUser(
      updatedOrder.customerId,
      "order:en-route",
      this.formatOrderResponse(updatedOrder, updatedOrder.customerId),
    );
    emitToOrderRoom(
      orderId,
      "order:updated",
      this.formatOrderResponse(updatedOrder),
    );

    NotificationService.sendPushNotification(
      updatedOrder.customerId,
      UserType.CUSTOMER,
      {
        title: "Order En Route",
        body: `Your order has been collected from the vendor and is coming your way.`,
        data: { orderId, status: "RIDER_EN_ROUTE_TO_CUSTOMER" },
      },
    ).catch((e: any) => logger.error("Push notification failing context:", e));

    if (updatedOrder.riderId) {
      NotificationService.sendPushNotification(
        updatedOrder.riderId,
        UserType.RIDER,
        {
          title: "Pickup Confirmed",
          body: `Package collection verified successfully. Deliver to customer dropoff address.`,
          data: { orderId, status: "RIDER_EN_ROUTE_TO_CUSTOMER" },
        },
      ).catch((e: any) =>
        logger.error("Push notification failing context:", e),
      );
    }

    return this.formatOrderResponse(updatedOrder, vendorId);
  }

  static async riderVerifyCustomerKeyAndDeliver(
    orderId: string,
    riderId: string,
    secretKey: string,
  ) {
    const orderContext = await prisma.order.findFirst({
      where: { id: orderId, riderId },
      select: {
        status: true,
        customerSecretKey: true,
        riderId: true,
        riderNet: true,
        customerId: true,
        vendorId: true,
      },
    });

    if (!orderContext) {
      throw new CustomError(
        "Order not found or unauthorized rider access",
        404,
        "ORDER_NOT_FOUND",
      );
    }

    if (orderContext.status !== OrderStatus.RIDER_EN_ROUTE_TO_CUSTOMER) {
      throw new CustomError(
        "Order status must be RIDER_EN_ROUTE_TO_CUSTOMER to perform final delivery verification",
        400,
        "INVALID_STATUS",
      );
    }

    if (orderContext.customerSecretKey !== secretKey) {
      throw new CustomError(
        "Invalid customer secret key verification failed",
        400,
        "INVALID_KEY",
      );
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
        include: this.orderIncludeOptions,
      }),
      prisma.wallet.update({
        where: { riderId: orderContext.riderId || undefined },
        data: { balance: { increment: orderContext.riderNet } },
      }),
    ]);

    emitToUser(
      updatedOrder.customerId,
      "order:delivered",
      this.formatOrderResponse(updatedOrder, updatedOrder.customerId),
    );
    emitToUser(
      updatedOrder.vendorId,
      "order:delivered",
      this.formatOrderResponse(updatedOrder, updatedOrder.vendorId),
    );
    emitToOrderRoom(
      orderId,
      "order:updated",
      this.formatOrderResponse(updatedOrder),
    );

    NotificationService.sendPushNotification(
      orderContext.customerId,
      UserType.CUSTOMER,
      {
        title: "Order Delivered",
        body: `Enjoy your delivery! Handover key clearance validation was successful.`,
        data: { orderId, status: "DELIVERED" },
      },
    ).catch((e: any) => logger.error("Push notification failing context:", e));

    NotificationService.sendPushNotification(
      orderContext.vendorId,
      UserType.VENDOR,
      {
        title: "Delivery Completed",
        body: `Order #${orderId} was safely handed over to the buyer.`,
        data: { orderId, status: "DELIVERED" },
      },
    ).catch((e: any) => logger.error("Push notification failing context:", e));

    return this.formatOrderResponse(updatedOrder, riderId);
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
      include: this.orderIncludeOptions,
    });

    const formattedResponse = this.formatOrderResponse(updatedOrder);
    emitToOrderRoom(orderId, "rider:location-updated", formattedResponse);
    return this.formatOrderResponse(updatedOrder, riderId);
  }
}
