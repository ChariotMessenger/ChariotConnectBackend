/// <reference types="node" />

import { PrismaClient, VerificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // await prisma.pricingConfiguration.create({
  //   data: {
  //     deliveryCut: 150.0,
  //     orderProtectionFee: 200.0,
  //     orderProcessingFee: 150.0,
  //   },
  // });

  const targetEmail = "kizzy.ok99@gmail.com";

  const vendor = await prisma.vendor.findUnique({
    where: { email: targetEmail },
  });

  if (vendor) {
    await prisma.wallet.upsert({
      where: { vendorId: vendor.id },
      update: { balance: 3000000.0 },
      create: {
        vendorId: vendor.id,
        balance: 3000000.0,
        currency: "NGN",
      },
    });
  }

  const rider = await prisma.rider.findUnique({
    where: { email: targetEmail },
  });

  if (rider) {
    await prisma.wallet.upsert({
      where: { riderId: rider.id },
      update: { balance: 3000000.0 },
      create: {
        riderId: rider.id,
        balance: 3000000.0,
        currency: "NGN",
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
