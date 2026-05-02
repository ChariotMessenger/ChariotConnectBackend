import { prisma } from "../../lib/prisma";
import { OrderStatus, VerificationStatus } from "@prisma/client";

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

export const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalCustomers,
    ordersToday,
    successfulDeliveries,
    transactions,
    pendingVendors,
    pendingRiders,
    recentOrders,
    recentCustomers,
    recentTransactions,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({
      where: { status: OrderStatus.DELIVERED, updatedAt: { gte: today } },
    }),
    prisma.transaction.findMany({
      where: { status: "SUCCESS", createdAt: { gte: today } },
      select: { amount: true, currency: true },
    }),
    prisma.vendor.count({
      where: { verificationStatus: VerificationStatus.PENDING },
    }),
    prisma.rider.count({
      where: { verificationStatus: VerificationStatus.PENDING },
    }),

    // Fetching data for Recent Activity
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

  // Transform into a unified Activity feed
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
    .slice(0, 10); // Final top 10 recent activities

  const transactionValues = transactions.reduce(
    (acc, curr) => {
      acc[curr.currency] = (acc[curr.currency] || 0) + curr.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    totalCustomers,
    ordersToday,
    successfulDeliveries,
    transactionValues,
    totalPendingVerifications: pendingVendors + pendingRiders,
    recentActivity: activities,
  };
};
