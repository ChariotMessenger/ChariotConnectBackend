import { prisma } from "../config/database";
export type TargetRole = "customer" | "rider" | "vendor";

export const getAppUpdatesByRole = async (
  role: TargetRole,
  page: number = 1,
  limit: number = 10,
  key?: string,
) => {
  const skip = (page - 1) * limit;

  let items: any[] = [];
  let total = 0;

  const whereClause: any = {};
  if (key) {
    whereClause.key = key;
  }

  switch (role) {
    case "customer":
      [items, total] = await Promise.all([
        prisma.customerAppUpdate.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { key: "asc" },
        }),
        prisma.customerAppUpdate.count({ where: whereClause }),
      ]);
      break;

    case "rider":
      [items, total] = await Promise.all([
        prisma.riderAppUpdate.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { key: "asc" },
        }),
        prisma.riderAppUpdate.count({ where: whereClause }),
      ]);
      break;

    case "vendor":
      [items, total] = await Promise.all([
        prisma.vendorAppUpdate.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { key: "asc" },
        }),
        prisma.vendorAppUpdate.count({ where: whereClause }),
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
