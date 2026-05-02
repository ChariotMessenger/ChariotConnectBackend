import { prisma } from "../../lib/prisma";
import { VerificationStatus, Vendor, Rider } from "@prisma/client";

export type VerificationVendorResult = Pick<
  Vendor,
  "id" | "businessName" | "email" | "phone" | "createdAt" | "businessType"
>;

export type VerificationRiderResult = Pick<
  Rider,
  | "id"
  | "firstName"
  | "lastName"
  | "email"
  | "bikePlateNumber"
  | "createdAt"
  | "state"
>;

interface VerificationResponse {
  vendors?: VerificationVendorResult[];
  riders?: VerificationRiderResult[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getVerificationRequests = async (
  type: "VENDOR" | "RIDER",
  page: number = 1,
  limit: number = 10,
): Promise<VerificationResponse> => {
  const skip = (page - 1) * limit;
  const results: Partial<VerificationResponse> = {};

  if (type === "VENDOR") {
    const [data, total] = await Promise.all([
      prisma.vendor.findMany({
        where: { verificationStatus: VerificationStatus.PENDING },
        select: {
          id: true,
          businessName: true,
          email: true,
          phone: true,
          createdAt: true,
          businessType: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.vendor.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
    ]);

    return {
      vendors: data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const [data, total] = await Promise.all([
    prisma.rider.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        bikePlateNumber: true,
        createdAt: true,
        state: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.rider.count({
      where: { verificationStatus: VerificationStatus.PENDING },
    }),
  ]);

  return {
    riders: data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
