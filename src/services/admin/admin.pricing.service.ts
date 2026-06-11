import { prisma } from "../../lib/prisma";
import { PricingConfiguration } from "@prisma/client";

export type UpdatePricingInput = Partial<
  Pick<
    PricingConfiguration,
    "deliveryCut" | "orderProtectionFee" | "orderProcessingFee"
  >
>;

export const getPricingConfiguration =
  async (): Promise<PricingConfiguration> => {
    const config = await prisma.pricingConfiguration.findFirst();

    if (!config) {
      return await prisma.pricingConfiguration.create({
        data: {},
      });
    }

    return config;
  };

export const updatePricingConfiguration = async (
  data: UpdatePricingInput,
): Promise<PricingConfiguration> => {
  const config = await getPricingConfiguration();

  return await prisma.pricingConfiguration.update({
    where: { id: config.id },
    data,
  });
};
