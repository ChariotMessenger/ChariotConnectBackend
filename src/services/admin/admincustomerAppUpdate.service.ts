import { prisma } from "../../lib/prisma";
import { CustomerAppUpdate } from "@prisma/client";

export type UpdateCustomerAppUpdateInput = Partial<
  Pick<
    CustomerAppUpdate,
    | "isUpdateAvailable"
    | "mustUpdate"
    | "androidAppLink"
    | "iosAppLink"
    | "isAndroid"
    | "isIos"
  >
>;

export const getCustomerAppUpdates = async (
  page: number = 1,
  limit: number = 10,
) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.customerAppUpdate.findMany({
      skip,
      take: limit,
      orderBy: { key: "asc" },
    }),
    prisma.customerAppUpdate.count(),
  ]);

  const formattedData = items.reduce(
    (acc, item) => {
      acc[item.key] = item;
      return acc;
    },
    {} as Record<string, CustomerAppUpdate>,
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

export const updateCustomerAppUpdateByKey = async (
  key: string,
  data: UpdateCustomerAppUpdateInput,
): Promise<CustomerAppUpdate> => {
  return await prisma.customerAppUpdate.upsert({
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
