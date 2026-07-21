import { prisma } from "../../lib/prisma";
import { RiderAppUpdate } from "@prisma/client";

export type UpdateRiderAppUpdateInput = Partial<
  Pick<
    RiderAppUpdate,
    | "isUpdateAvailable"
    | "mustUpdate"
    | "androidAppLink"
    | "iosAppLink"
    | "isAndroid"
    | "isIos"
  >
>;

export const getRiderAppUpdates = async (
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.riderAppUpdate.findMany({
      skip,
      take: limit,
      orderBy: { key: "asc" },
    }),
    prisma.riderAppUpdate.count(),
  ]);

  const formattedData = items.reduce(
    (acc, item) => {
      acc[item.key] = item;
      return acc;
    },
    {} as Record<string, RiderAppUpdate>,
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

export const updateRiderAppUpdateByKey = async (
  key: string,
  data: UpdateRiderAppUpdateInput,
): Promise<RiderAppUpdate> => {
  return await prisma.riderAppUpdate.upsert({
    where: { key },
    update: data,
    create: {
      key,
      androidAppLink: data.androidAppLink || "",
      iosAppLink: data.iosAppLink || "",
      isUpdateAvailable: data.isUpdateAvailable ?? false,
      mustUpdate: data.mustUpdate ?? false,
      isAndroid: data.isAndroid ?? true,
      isIos: data.isIos ?? true,
    },
  });
};
