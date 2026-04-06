import { prisma } from "../../config/database";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export class AdminAnalyticsService {
  public static async getDashboardStats() {
    const [
      totalCustomers,
      totalVendors,
      totalRiders,
      totalOrders,
      successfulDeliveries,
      revenueResult,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.vendor.count(),
      prisma.rider.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      prisma.transaction.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCustomers,
      totalVendors,
      totalRiders,
      totalOrders,
      successfulDeliveries,
      totalTransactionValue: revenueResult._sum.amount || 0,
    };
  }

  public static async getRecentActivities(query: {
    page: number;
    limit: number;
    search?: string;
    status?: OrderStatus;
  }) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          {
            vendor: { businessName: { contains: search, mode: "insensitive" } },
          },
        ],
      }),
    };

    const [activities, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          vendor: { select: { businessName: true } },
          transactions: {
            select: { status: true, reference: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      activities,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }
}
