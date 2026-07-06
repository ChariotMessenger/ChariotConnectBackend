import { PrismaClient, VerificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

export interface VerificationItem {
  id: string;
  type: "VENDOR" | "RIDER";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  businessName?: string;
  areaOfWork?: string;
}

export const adminVerificationService = {
  async getPendingVerifications(limit: number, offset: number) {
    const [vendors, riders, totalPendingVendors, totalPendingRiders] =
      await Promise.all([
        prisma.vendor.findMany({
          where: { verificationStatus: VerificationStatus.PENDING },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            country: true,
            verificationStatus: true,
            createdAt: true,
            businessName: true,
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.rider.findMany({
          where: { verificationStatus: VerificationStatus.PENDING },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            country: true,
            verificationStatus: true,
            createdAt: true,
            areaOfWork: true,
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.vendor.count({
          where: { verificationStatus: VerificationStatus.PENDING },
        }),
        prisma.rider.count({
          where: { verificationStatus: VerificationStatus.PENDING },
        }),
      ]);

    const normalizedVendors: VerificationItem[] = vendors.map((v) => ({
      id: v.id,
      type: "VENDOR",
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phone: v.phone,
      country: v.country,
      verificationStatus: v.verificationStatus,
      createdAt: v.createdAt,
      businessName: v.businessName,
    }));

    const normalizedRiders: VerificationItem[] = riders.map((r) => ({
      id: r.id,
      type: "RIDER",
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      country: r.country,
      verificationStatus: r.verificationStatus,
      createdAt: r.createdAt,
      areaOfWork: r.areaOfWork,
    }));

    const combinedList = [...normalizedVendors, ...normalizedRiders].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const paginatedItems = combinedList.slice(offset, offset + limit);
    const totalCount = totalPendingVendors + totalPendingRiders;

    return {
      items: paginatedItems,
      meta: {
        totalCount,
        totalPendingVendors,
        totalPendingRiders,
        limit,
        offset,
        hasNextPage: offset + limit < totalCount,
      },
    };
  },
};
