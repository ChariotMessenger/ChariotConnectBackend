// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {
//   const customerUpdates = [
//     {
//       key: "customers_app_update1",
//       isUpdateAvailable: true,
//       mustUpdate: true,
//       androidAppLink:
//         "https://play.google.com/store/apps/details?id=com.chariotconnect.customer",
//       iosAppLink: "https://apps.apple.com/app/id0000000001",
//       isAndroid: true,
//       isIos: true,
//     },
//     {
//       key: "customers_app_update2",
//       isUpdateAvailable: true,
//       mustUpdate: false,
//       androidAppLink:
//         "https://play.google.com/store/apps/details?id=com.chariotconnect.customer",
//       iosAppLink: "https://apps.apple.com/app/id0000000001",
//       isAndroid: true,
//       isIos: true,
//     },
//     {
//       key: "customers_app_update3",
//       isUpdateAvailable: false,
//       mustUpdate: false,
//       androidAppLink:
//         "https://play.google.com/store/apps/details?id=com.chariotconnect.customer",
//       iosAppLink: "https://apps.apple.com/app/id0000000001",
//       isAndroid: true,
//       isIos: true,
//     },
//   ];

//   const riderUpdates = [
//     {
//       key: "riders_app_update1",
//       isUpdateAvailable: true,
//       mustUpdate: true,
//       androidAppLink:
//         "https://play.google.com/store/apps/details?id=com.chariotconnect.rider",
//       iosAppLink: "https://apps.apple.com/app/id0000000002",
//       isAndroid: true,
//       isIos: true,
//     },
//     {
//       key: "riders_app_update2",
//       isUpdateAvailable: false,
//       mustUpdate: false,
//       androidAppLink:
//         "https://play.google.com/store/apps/details?id=com.chariotconnect.rider",
//       iosAppLink: "https://apps.apple.com/app/id0000000002",
//       isAndroid: true,
//       isIos: true,
//     },
//   ];

//   const vendorUpdates = [
//     {
//       key: "vendors_app_update1",
//       isUpdateAvailable: true,
//       mustUpdate: true,
//       androidAppLink:
//         "https://play.google.com/store/apps/details?id=com.chariotconnect.vendor",
//       iosAppLink: "https://apps.apple.com/app/id0000000003",
//       isAndroid: true,
//       isIos: true,
//     },
//     {
//       key: "vendors_app_update2",
//       isUpdateAvailable: false,
//       mustUpdate: false,
//       androidAppLink:
//         "https://play.google.com/store/apps/details?id=com.chariotconnect.vendor",
//       iosAppLink: "https://apps.apple.com/app/id0000000003",
//       isAndroid: true,
//       isIos: true,
//     },
//   ];

//   for (const data of customerUpdates) {
//     await prisma.customerAppUpdate.upsert({
//       where: { key: data.key },
//       update: data,
//       create: data,
//     });
//   }

//   for (const data of riderUpdates) {
//     await prisma.riderAppUpdate.upsert({
//       where: { key: data.key },
//       update: data,
//       create: data,
//     });
//   }

//   for (const data of vendorUpdates) {
//     await prisma.vendorAppUpdate.upsert({
//       where: { key: data.key },
//       update: data,
//       create: data,
//     });
//   }
// }

// main()
//   .catch((e) => {
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
