import { PrismaClient } from "@prisma/client";

declare const process: {
  exit: (code?: number) => void;
};

const prisma = new PrismaClient();

async function main() {
  const customerUpdates = [
    {
      key: "customers_app_update1",
      isUpdateAvailable: false,
      mustUpdate: false,
      androidAppLink:
        "https://play.google.com/store/apps/details?id=com.chariotconnect.customer",
      iosAppLink: "https://apps.apple.com/app/id0000000001",
      isAndroid: true,
      isIos: true,
    },
  ];

  const riderUpdates = [
    {
      key: "riders_app_update1",
      isUpdateAvailable: false,
      mustUpdate: false,
      androidAppLink:
        "https://play.google.com/store/apps/details?id=com.chariotconnect.rider",
      iosAppLink: "https://apps.apple.com/app/id0000000002",
      isAndroid: true,
      isIos: true,
    },
  ];

  const vendorUpdates = [
    {
      key: "vendors_app_update1",
      isUpdateAvailable: false,
      mustUpdate: false,
      androidAppLink:
        "https://play.google.com/store/apps/details?id=com.chariotconnect.vendor",
      iosAppLink: "https://apps.apple.com/app/id0000000003",
      isAndroid: true,
      isIos: true,
    },
  ];

  for (const update of customerUpdates) {
    await prisma.customerAppUpdate.upsert({
      where: { key: update.key },
      update: {
        mustUpdate: false,
        isUpdateAvailable: update.isUpdateAvailable,
        androidAppLink: update.androidAppLink,
        iosAppLink: update.iosAppLink,
      },
      create: update,
    });
  }

  for (const update of riderUpdates) {
    await prisma.riderAppUpdate.upsert({
      where: { key: update.key },
      update: {
        mustUpdate: false,
        isUpdateAvailable: update.isUpdateAvailable,
        androidAppLink: update.androidAppLink,
        iosAppLink: update.iosAppLink,
      },
      create: update,
    });
  }

  for (const update of vendorUpdates) {
    await prisma.vendorAppUpdate.upsert({
      where: { key: update.key },
      update: {
        mustUpdate: false,
        isUpdateAvailable: update.isUpdateAvailable,
        androidAppLink: update.androidAppLink,
        iosAppLink: update.iosAppLink,
      },
      create: update,
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
