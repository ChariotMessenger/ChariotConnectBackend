import { PrismaClient, ParcelDeliveryStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class RiderMetricsService {
  static async getRiderTodayStats(riderId: string) {
    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      select: { currency: true },
    });

    const riderCurrency = rider?.currency || "NGN";

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const ordersToday = await prisma.order.findMany({
      where: {
        riderId,
        status: "DELIVERED",
        deliveredAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        riderNet: true,
      },
    });

    const packagesToday = await prisma.deliverPackageData.findMany({
      where: {
        riderId,
        status: ParcelDeliveryStatus.ALL_PACKAGE_DELIVERED,
        timeCompleted: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        pickupSummary: true,
      },
    });

    const orderEarnings = ordersToday.reduce(
      (sum, order) => sum + (order.riderNet || 0),
      0,
    );
    const packageEarnings = packagesToday.reduce((sum, pkg) => {
      const info = pkg.pickupSummary as any;
      return sum + (info?.deliveryFee || 0);
    }, 0);

    const totalMoneyEarned = orderEarnings + packageEarnings;
    const totalJobsDone = ordersToday.length + packagesToday.length;

    return {
      totalMoneyEarned,
      totalJobsDone,
      currency: riderCurrency,
      date: startOfToday.toISOString().split("T")[0],
    };
  }
}
