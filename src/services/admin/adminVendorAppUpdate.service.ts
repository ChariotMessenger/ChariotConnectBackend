import { prisma } from "../../lib/prisma";
import { VendorAppUpdate } from "@prisma/client";

export type UpdateVendorAppUpdateInput = Partial<
  Pick<
    VendorAppUpdate,
    | "isUpdateAvailable"
    | "mustUpdate"
    | "androidAppLink"
    | "iosAppLink"
    | "isAndroid"
    | "isIos"
  >
>;

export const getVendorAppUpdates = async (
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.vendorAppUpdate.findMany({
      skip,
      take: limit,
      orderBy: { key: "asc" },
    }),
    prisma.vendorAppUpdate.count(),
  ]);

  const formattedData = items.reduce(
    (acc, item) => {
      acc[item.key] = item;
      return acc;
    },
    {} as Record<string, VendorAppUpdate>,
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

export const updateVendorAppUpdateByKey = async (
  key: string,
  data: UpdateVendorAppUpdateInput,
): Promise<VendorAppUpdate> => {
  return await prisma.vendorAppUpdate.upsert({
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
