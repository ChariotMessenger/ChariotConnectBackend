// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {
//   await prisma.customerAppUpdate.deleteMany({});
//   await prisma.riderAppUpdate.deleteMany({});
//   await prisma.vendorAppUpdate.deleteMany({});

//   const customerUpdate = {
//     key: "customers_app_update1",
//     isUpdateAvailable: true,
//     mustUpdate: false,
//     androidAppLink:
//       "https://play.google.com/store/apps/details?id=com.chariotconnect.customer",
//     iosAppLink: "https://apps.apple.com/app/id0000000001",
//     isAndroid: true,
//     isIos: true,
//   };

//   const riderUpdate = {
//     key: "riders_app_update1",
//     isUpdateAvailable: true,
//     mustUpdate: false,
//     androidAppLink:
//       "https://play.google.com/store/apps/details?id=com.chariotconnect.rider",
//     iosAppLink: "https://apps.apple.com/app/id0000000002",
//     isAndroid: true,
//     isIos: true,
//   };

//   const vendorUpdate = {
//     key: "vendors_app_update1",
//     isUpdateAvailable: true,
//     mustUpdate: false,
//     androidAppLink:
//       "https://play.google.com/store/apps/details?id=com.chariotconnect.vendor",
//     iosAppLink: "https://apps.apple.com/app/id0000000003",
//     isAndroid: true,
//     isIos: true,
//   };

//   await prisma.customerAppUpdate.upsert({
//     where: { key: customerUpdate.key },
//     update: customerUpdate,
//     create: customerUpdate,
//   });

//   await prisma.riderAppUpdate.upsert({
//     where: { key: riderUpdate.key },
//     update: riderUpdate,
//     create: riderUpdate,
//   });

//   await prisma.vendorAppUpdate.upsert({
//     where: { key: vendorUpdate.key },
//     update: vendorUpdate,
//     create: vendorUpdate,
//   });
// }

// main()
//   .catch((e) => {
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
