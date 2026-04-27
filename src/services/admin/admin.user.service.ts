import { PrismaClient, VerificationStatus, OnlineStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class AdminUserManagementService {
  /**
   * Manage Vendors
   */
  async getAllVendors(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: VerificationStatus;
    verified?: boolean;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        query.search
          ? {
              OR: [
                {
                  businessName: {
                    contains: query.search,
                    mode: "insensitive" as any,
                  },
                },
                {
                  email: { contains: query.search, mode: "insensitive" as any },
                },
                {
                  phone: { contains: query.search, mode: "insensitive" as any },
                },
              ],
            }
          : {},
        query.status ? { verificationStatus: query.status } : {},
        query.verified !== undefined ? { verified: query.verified } : {},
      ],
    };

    const [total, vendors] = await prisma.$transaction([
      prisma.vendor.count({ where }),
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data: vendors,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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
    verified?: boolean;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        query.search
          ? {
              OR: [
                {
                  firstName: {
                    contains: query.search,
                    mode: "insensitive" as any,
                  },
                },
                {
                  lastName: {
                    contains: query.search,
                    mode: "insensitive" as any,
                  },
                },
                {
                  email: { contains: query.search, mode: "insensitive" as any },
                },
              ],
            }
          : {},
        query.status ? { verificationStatus: query.status } : {},
        query.onlineStatus ? { onlineStatus: query.onlineStatus } : {},
        query.verified !== undefined ? { verified: query.verified } : {},
      ],
    };

    const [total, riders] = await prisma.$transaction([
      prisma.rider.count({ where }),
      prisma.rider.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data: riders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

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

    const where = query.search
      ? {
          OR: [
            {
              firstName: { contains: query.search, mode: "insensitive" as any },
            },
            {
              lastName: { contains: query.search, mode: "insensitive" as any },
            },
            { email: { contains: query.search, mode: "insensitive" as any } },
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
      }),
    ]);

    return {
      data: customers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Verification Services
   * For Vendors and Riders
   */
  async verifyUser(
    type: "vendor" | "rider",
    id: string,
    action: "VERIFY" | "REJECT",
  ) {
    const status =
      action === "VERIFY"
        ? VerificationStatus.VERIFIED
        : VerificationStatus.REJECTED;
    const isVerified = action === "VERIFY";

    if (type === "vendor") {
      return await prisma.vendor.update({
        where: { id },
        data: {
          verificationStatus: status,
          verified: isVerified,
        },
      });
    } else {
      return await prisma.rider.update({
        where: { id },
        data: {
          verificationStatus: status,
          verified: isVerified,
        },
      });
    }
  }

  async getAccountDetails(type: "vendor" | "rider" | "customer", id: string) {
    const delegate = (prisma as any)[type];
    return await delegate.findUnique({
      where: { id },
    });
  }
}
