import { PrismaClient, VerificationStatus, OnlineStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class AdminUserManagementService {
  /**
   * Manage Customers
   */
  async getAllCustomers(query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: "insensitive" } },
            { lastName: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { id: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, customers] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Manage Vendors
   */
  async getAllVendors(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: VerificationStatus;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      AND: [
        query.search
          ? {
              OR: [
                {
                  businessName: { contains: query.search, mode: "insensitive" },
                },
                { id: { contains: query.search, mode: "insensitive" } },
                {
                  contactPerson: {
                    contains: query.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {},
        query.status ? { verificationStatus: query.status } : {},
      ],
    };

    const [total, approvedCount, vendors] = await prisma.$transaction([
      prisma.vendor.count({ where }),
      prisma.vendor.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return {
      data: vendors,
      meta: {
        total,
        approvedCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Manage Riders
   */
  async getAllRiders(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: VerificationStatus;
    onlineStatus?: OnlineStatus;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      AND: [
        query.search
          ? {
              OR: [
                { firstName: { contains: query.search, mode: "insensitive" } },
                { lastName: { contains: query.search, mode: "insensitive" } },
                { id: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {},
        query.status ? { verificationStatus: query.status } : {},
        query.onlineStatus ? { onlineStatus: query.onlineStatus } : {},
      ],
    };

    const [total, approvedCount, riders] = await prisma.$transaction([
      prisma.rider.count({ where }),
      prisma.rider.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.rider.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { deliveries: true } },
        },
      }),
    ]);

    return {
      data: riders,
      meta: {
        total,
        approvedCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorDetails(id: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            customer: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!vendor) return null;

    const [earnings, pendingSettlement] = await Promise.all([
      prisma.order.aggregate({
        where: { vendorId: id, status: "DELIVERED" },
        _sum: { vendorNet: true },
      }),
      prisma.order.aggregate({
        where: {
          vendorId: id,
          settlementStatus: "PENDING",
          status: "DELIVERED",
        },
        _sum: { vendorNet: true },
      }),
    ]);

    return {
      ...vendor,
      stats: {
        ordersRouted: vendor._count?.orders || 0,
        totalEarned: earnings._sum.vendorNet || 0,
        pendingSettlement: pendingSettlement._sum.vendorNet || 0,
      },
    };
  }

  async getRiderDetails(id: string) {
    const rider = await prisma.rider.findUnique({
      where: { id },
      include: {
        deliveries: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            customer: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { deliveries: true } },
      },
    });

    if (!rider) return null;

    const [deliveryStats, pendingPayout] = await Promise.all([
      prisma.order.aggregate({
        where: { riderId: id, status: "DELIVERED" },
        _count: { _all: true },
        _sum: { deliveryFee: true },
      }),
      prisma.order.aggregate({
        where: { riderId: id, payoutStatus: "PENDING", status: "DELIVERED" },
        _sum: { deliveryFee: true },
      }),
    ]);

    return {
      ...rider,
      stats: {
        successfulDeliveries: deliveryStats._count._all || 0,
        totalEarned: deliveryStats._sum.deliveryFee || 0,
        pendingPayout: pendingPayout._sum.deliveryFee || 0,
      },
    };
  }

  async verifyUser(
    type: "vendor" | "rider",
    id: string,
    action: "VERIFY" | "REJECT",
  ) {
    const status =
      action === "VERIFY"
        ? VerificationStatus.VERIFIED
        : VerificationStatus.REJECTED;

    const delegate = (prisma as any)[type];

    return await delegate.update({
      where: { id },
      data: {
        verificationStatus: status,
        verified: action === "VERIFY",
      },
    });
  }

  async getAccountDetails(type: "vendor" | "rider" | "customer", id: string) {
    if (type === "vendor") return this.getVendorDetails(id);
    if (type === "rider") return this.getRiderDetails(id);

    return await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { orders: true } },
      },
    });
  }
}
