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

export const getDashboardStats = async () => {
  const now = new Date();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

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
      where: { status: OrderStatus.DELIVERED, updatedAt: { gte: todayStart } },
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

  const transactionValuesYesterday = transactionsYesterday.reduce(
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
  const totalValueYesterday = Object.values(transactionValuesYesterday).reduce(
    (a, b) => a + b,
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
};
