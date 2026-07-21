import { prisma } from "../config/database";
export type TargetRole = "customer" | "rider" | "vendor";

export const getAppUpdatesByRole = async (
  role: TargetRole,
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;

  let items: any[] = [];
  let total = 0;

  switch (role) {
    case "customer":
      [items, total] = await Promise.all([
        prisma.customerAppUpdate.findMany({
          skip,
          take: limit,
          orderBy: { key: "asc" },
        }),
        prisma.customerAppUpdate.count(),
      ]);
      break;

    case "rider":
      [items, total] = await Promise.all([
        prisma.riderAppUpdate.findMany({
          skip,
          take: limit,
          orderBy: { key: "asc" },
        }),
        prisma.riderAppUpdate.count(),
      ]);
      break;

    case "vendor":
      [items, total] = await Promise.all([
        prisma.vendorAppUpdate.findMany({
          skip,
          take: limit,
          orderBy: { key: "asc" },
        }),
        prisma.vendorAppUpdate.count(),
      ]);
      break;

    default:
      throw new Error("Invalid target role provided");
  }

  const formattedData = items.reduce(
    (acc, item) => {
      acc[item.key] = item;
      return acc;
    },
    {} as Record<string, any>,
  );

  return {
    data: formattedData,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
