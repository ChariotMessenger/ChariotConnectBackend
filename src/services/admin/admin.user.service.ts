import { PrismaClient, VerificationStatus, OnlineStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class AdminUserManagementService {
  /**
   * Manage Vendors - Matches "Vendors" UI
   * Shows Station ID, Name, Location, Orders, Status, Contact Person
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
                { stationId: { contains: query.search, mode: "insensitive" } },
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
          _count: {
            select: { orders: true },
          },
        },
      }),
    ]);

    return {
      data: vendors,
      meta: {
        total,
        approvedCount, // For the "Approved 60 partners" label
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Manage Riders - Matches "Rider Details" UI
   * Shows Driver ID, Full Name, Phone, Deliveries, Status, Vehicle
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
                { driverId: { contains: query.search, mode: "insensitive" } },
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
          _count: {
            select: { deliveries: true }, // Assuming relation name is deliveries
          },
        },
      }),
    ]);

    return {
      data: riders,
      meta: {
        total,
        approvedCount, // For the "Approved 120 riders" label
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Manage Customers - Matches "Users" UI
   * Shows User ID, Full Name, Email, Phone, Orders, Status
   */
  async getAllCustomers(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string; // e.g., 'Active' or 'Suspended'
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
                { email: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {},
        query.status ? { status: query.status } : {},
      ],
    };

    const [total, customers] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
    ]);

    return {
      data: customers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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

    // In the UI, 'verified' is likely the boolean trigger for the 'Approved' badge
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
    const delegate = (prisma as any)[type];
    return await delegate.findUnique({
      where: { id },
      include:
        type === "customer"
          ? { orders: true }
          : type === "vendor"
            ? { products: true, orders: true }
            : { deliveries: true },
    });
  }
}
