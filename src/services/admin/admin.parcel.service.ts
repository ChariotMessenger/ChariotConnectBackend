import { PrismaClient, ParcelDeliveryStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const adminParcelService = {
  async getParcelDeliveries(
    page: number,
    limit: number,
    status?: ParcelDeliveryStatus,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: search.match(/^[0-9a-fA-F]{24}$/) ? search : undefined },
        {
          customer: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          rider: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ].filter(Boolean);
    }

    const [items, total] = await Promise.all([
      prisma.deliverPackageData.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          rider: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.deliverPackageData.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getParcelDeliveryDetails(id: string) {
    const parcel = await prisma.deliverPackageData.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        rider: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    if (!parcel) {
      throw new Error("Parcel delivery record not found");
    }

    return parcel;
  },
};
