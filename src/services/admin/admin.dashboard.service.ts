import { prisma } from "../../lib/prisma";
import { OrderStatus, PaymentStatus, VerificationStatus } from "@prisma/client";

export type ActivityType =
  | "New Order"
  | "Delivery Completed"
  | "Driver Assigned"
  | "Payment Received"
  | "New Registration";

export interface PlatformActivity {
  type: ActivityType;
  userName: string;
  orderId: string | null;
  status: string;
  createdAt: Date;
}

const calculatePercentageChange = (
  current: number,
  previous: number,
  label: string,
) => {
  if (previous === 0) return current > 0 ? `+100% ${label}` : `0% ${label}`;
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}% ${label}`;
};

export const AdminService = {
  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      prevMonthCustomers,
      ordersToday,
      ordersYesterday,
      successfulDeliveriesToday,
      successfulDeliveriesYesterday,
      transactionsToday,
      transactionsYesterday,
      pendingVendors,
      pendingRiders,
      recentOrders,
      recentCustomers,
      recentTransactions,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { createdAt: { lt: thisMonthStart } } }),

      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({
        where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),

      prisma.order.count({
        where: {
          status: OrderStatus.DELIVERED,
          updatedAt: { gte: todayStart },
        },
      }),
      prisma.order.count({
        where: {
          status: OrderStatus.DELIVERED,
          updatedAt: { gte: yesterdayStart, lt: todayStart },
        },
      }),

      prisma.transaction.findMany({
        where: { status: "SUCCESS", createdAt: { gte: todayStart } },
        select: { amount: true, currency: true },
      }),
      prisma.transaction.findMany({
        where: {
          status: "SUCCESS",
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
        select: { amount: true, currency: true },
      }),

      prisma.vendor.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
      prisma.rider.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),

      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { firstName: true, lastName: true } } },
      }),
      prisma.customer.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { firstName: true, lastName: true, createdAt: true },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: {
              customer: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

    const activities: PlatformActivity[] = [
      ...recentOrders.map((o) => ({
        type:
          o.status === "DELIVERED"
            ? "Delivery Completed"
            : ("New Order" as ActivityType),
        userName: `${o.customer.firstName} ${o.customer.lastName}`,
        orderId: o.id,
        status: o.status,
        createdAt: o.createdAt,
      })),
      ...recentCustomers.map((c) => ({
        type: "New Registration" as ActivityType,
        userName: `${c.firstName} ${c.lastName}`,
        orderId: null,
        status: "Active",
        createdAt: c.createdAt,
      })),
      ...recentTransactions.map((t) => ({
        type: "Payment Received" as ActivityType,
        userName: `${t.order.customer.firstName} ${t.order.customer.lastName}`,
        orderId: t.orderId,
        status: t.status,
        createdAt: t.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    const transactionValuesToday = transactionsToday.reduce(
      (acc, curr) => {
        acc[curr.currency] = (acc[curr.currency] || 0) + curr.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalValueToday = Object.values(transactionValuesToday).reduce(
      (a, b) => a + b,
      0,
    );
    const totalValueYesterday = transactionsYesterday.reduce(
      (a, b) => a + b.amount,
      0,
    );

    return {
      totalCustomers: {
        value: totalCustomers,
        change: calculatePercentageChange(
          totalCustomers,
          prevMonthCustomers,
          "from last month",
        ),
      },
      ordersToday: {
        value: ordersToday,
        change: calculatePercentageChange(
          ordersToday,
          ordersYesterday,
          "vs yesterday",
        ),
      },
      successfulDeliveries: {
        value: successfulDeliveriesToday,
        change: calculatePercentageChange(
          successfulDeliveriesToday,
          successfulDeliveriesYesterday,
          "vs yesterday",
        ),
      },
      transactionValue: {
        values: transactionValuesToday,
        change: calculatePercentageChange(
          totalValueToday,
          totalValueYesterday,
          "vs yesterday",
        ),
      },
      totalPendingVerifications: pendingVendors + pendingRiders,
      recentActivity: activities,
    };
  },

  async getTransactions(page = 1, limit = 10, status?: PaymentStatus) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: status ? { status } : {},
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: {
              customer: { select: { firstName: true, lastName: true } },
              vendor: { select: { businessName: true } },
              rider: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.transaction.count({ where: status ? { status } : {} }),
    ]);

    return {
      transactions: transactions.map((txn) => ({
        transactionId: txn.id,
        customer: `${txn.order.customer.firstName} ${txn.order.customer.lastName}`,
        vendor: txn.order.vendor?.businessName || "N/A",
        driver: txn.order.rider
          ? `${txn.order.rider.firstName} ${txn.order.rider.lastName}`
          : "Unassigned",
        grossNet: txn.amount,
        chariotNet: txn.order.totalAmount - txn.order.vendorNet,
        status: txn.status,
      })),
      total,
    };
  },
  async getTransactionDetail(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        order: {
          include: {
            customer: true,
            vendor: true,
            rider: true,
          },
        },
      },
    });

    if (!transaction) return null;
    const { order } = transaction;

    // Assuming items is an array of objects stored in the Json field
    const orderItems = Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          name: item.name || "Unknown Item",
          price: item.price || 0,
          quantity: item.quantity || 1,
        }))
      : [];

    return {
      txnId: transaction.id,
      customerOrder: {
        orderId: order.id,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        status: order.status,
        items: orderItems,
        grossAmount: order.totalAmount,
      },
      timestamp: {
        orderPlaced: order.createdAt,
        riderAssigned: order.pickupAt, // Using pickupAt as the closest timestamp available
        deliveryStarted: order.pickupAt,
        deliveryCompleted: order.deliveredAt,
        vendorDelay: "2 mins",
      },
      deliveryDetails: {
        payoutStatus: order.payoutStatus,
        assignedRider: order.rider
          ? `${order.rider.firstName} ${order.rider.lastName}`
          : "N/A",
        deliveryAddress: order.notes || "No address provided",
        deliveryFee: order.deliveryFee,
        chariotFee: 500,
        riderEarnings: order.deliveryFee - 500,
        vendorName: order.vendor?.businessName,
        vendorLocation: order.vendor?.country, // Using country as locationName doesn't exist
      },
      chariotNet: {
        // Calculate chariotNet as total minus what the vendor gets
        total: order.totalAmount - order.vendorNet,
        breakdown: {
          vendorFee: order.totalAmount - order.vendorNet,
          deliveryCut: 500,
        },
      },
    };
  },

  async getOrders(page = 1, limit = 10, status?: OrderStatus) {
    const skip = (page - 1) * limit;
    const orders = await prisma.order.findMany({
      where: status ? { status } : {},
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        vendor: { select: { businessName: true } },
        rider: { select: { firstName: true, lastName: true } },
      },
    });

    return orders.map((o) => ({
      orderId: o.id,
      customer: `${o.customer.firstName} ${o.customer.lastName}`,
      station: o.vendor?.businessName || "N/A",
      driver: o.rider
        ? `${o.rider.firstName} ${o.rider.lastName}`
        : "Unassigned",
      quantity: "10L",
      fuelType: "Food",
      grossAmount: o.totalAmount,
      status: o.status,
    }));
  },

  async getOrderDetail(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        vendor: true,
        rider: true,
      },
    });

    if (!order) return null;

    return {
      customerOrder: {
        orderId: order.id,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        orderType: "Food", // Hardcoded as per screenshot requirement
        orderStatus: order.status,
        items: order.items, // Json field
        grossAmount: order.totalAmount,
        fluidPrice: "₦290,000 - ₦1,300/L",
      },
      deliveryDetails: {
        deliveryStatus: order.rider ? "Driver assigned" : "Pending",
        assignedDriver: order.rider
          ? `${order.rider.firstName} ${order.rider.lastName}`
          : "N/A",
        station: order.vendor.businessName,
        deliveryAddress: order.notes || "No address provided", // Points are objects, using notes or business address instead
        deliveryFee: order.deliveryFee,
        chariotFee: 500,
        riderReceive: order.deliveryFee - 500,
      },
      timestamp: {
        orderPlaced: order.createdAt,
        driverAssigned: order.pickupAt, // Mapping based on available DateTime fields
        deliveryStarted: order.pickupAt,
        deliveryCompleted: order.deliveredAt,
        stationDelay: "2 mins",
      },
      vendorsSale: {
        stationName: order.vendor.businessName,
        stationLocation: order.vendor.businessType,
        orderType: "Food",
        volumeSold: "10 L",
        amountSold: order.vendorNet,
        fluidPrice: "₦290,000 - ₦1,300/L",
      },
    };
  },

  async getPricingConfig() {
    let config = await prisma.pricingConfiguration.findFirst();
    if (!config)
      config = await prisma.pricingConfiguration.create({ data: {} });
    return config;
  },

  async updatePricing(data: {
    deliveryCut?: number;
    orderProtectionFee?: number;
    orderProcessingFee?: number;
  }) {
    const config = await this.getPricingConfig();
    return await prisma.pricingConfiguration.update({
      where: { id: config.id },
      data,
    });
  },
};
