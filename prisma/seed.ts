import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanWallets() {
  try {
    const resultRider = await prisma.$runCommandRaw({
      update: "Wallet",
      updates: [
        {
          q: { riderId: null },
          u: { $unset: { riderId: "" } },
          multi: true,
        },
      ],
    });

    const resultVendor = await prisma.$runCommandRaw({
      update: "Wallet",
      updates: [
        {
          q: { vendorId: null },
          u: { $unset: { vendorId: "" } },
          multi: true,
        },
      ],
    });

    console.log("Rider cleanup result:", resultRider);
    console.log("Vendor cleanup result:", resultVendor);
  } catch (error) {
    console.error("Error cleaning up wallets:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanWallets();
