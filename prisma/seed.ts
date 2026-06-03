/// <reference types="node" />

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.pricingConfiguration.create({
    data: {
      deliveryCut: 1500.0,
      orderProtectionFee: 200.0,
      orderProcessingFee: 150.0,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
