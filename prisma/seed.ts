/// <reference types="node" />

import { PrismaClient, VerificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // const deleteOrders = await prisma.order.deleteMany({});
  // console.log(`Successfully cleared ${deleteOrders.count} order records.`);

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
    const latestVendorRequest = await prisma.bankDetailsChangeRequest.findFirst(
      {
        where: {
          vendorId: vendor.id,
          status: VerificationStatus.PENDING,
        },
        orderBy: { createdAt: "desc" },
      },
    );

    if (latestVendorRequest) {
      await prisma.$transaction([
        prisma.bankDetailsChangeRequest.update({
          where: { id: latestVendorRequest.id },
          data: { status: VerificationStatus.VERIFIED },
        }),
        prisma.vendor.update({
          where: { id: vendor.id },
          data: {
            bankName: latestVendorRequest.newBankName,
            accountNumber: latestVendorRequest.newAccountNumber,
            accountName: latestVendorRequest.newAccountName,
          },
        }),
      ]);
    }
  }

  const rider = await prisma.rider.findUnique({
    where: { email: targetEmail },
  });

  if (rider) {
    const latestRiderRequest = await prisma.bankDetailsChangeRequest.findFirst({
      where: {
        riderId: rider.id,
        status: VerificationStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
    });

    if (latestRiderRequest) {
      await prisma.$transaction([
        prisma.bankDetailsChangeRequest.update({
          where: { id: latestRiderRequest.id },
          data: { status: VerificationStatus.VERIFIED },
        }),
        prisma.rider.update({
          where: { id: rider.id },
          data: {
            bankName: latestRiderRequest.newBankName,
            accountNumber: latestRiderRequest.newAccountNumber,
            accountName: latestRiderRequest.newAccountName,
          },
        }),
      ]);
    }
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
