/// <reference types="node" />

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.deliverPackageData.deleteMany({});

  const targetCustomerId = "6a354629a1b67a1fdf148ae3";

  // await prisma.deliverPackageData.create({
  //   data: {
  //     customerId: targetCustomerId,
  //     avgDistanceKm: "5.0",
  //     note: "Seed package delivery entry",
  //     status: "WAITING_FOR_RIDER_TO_ACCEPT",
  //     currency: "NGN",
  //     pickupSummary: {
  //       pickupSecretKey: "PK-SEED-9921",
  //       pickupLocation: {
  //         latitude: 6.5244,
  //         longitude: 3.3792,
  //         locationName: "Main Pickup Hub",
  //         fullAddress: "123 Commercial Way, Yaba, Lagos, Nigeria",
  //         shortAddress: "Yaba, Lagos",
  //         placeId: "chIJz1v_seed_pickup_id",
  //         tag: "other",
  //       },
  //       expectedPickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
  //       totalAmountToPay: 100.0,
  //       deliveryFee: 100.0,
  //       protectionFee: 0.0,
  //     },
  //     deliveryStops: [
  //       {
  //         label: "Stop 1",
  //         stopInfo: {
  //           receiverName: "John Doe",
  //           receiverPhoneNumber: "+2348000000000",
  //           confirmationKey: "CK-SEED-8831",
  //           isDelivered: false,
  //           stopLocation: {
  //             latitude: 6.5124,
  //             longitude: 3.3612,
  //             locationName: "Residential Dropoff",
  //             fullAddress: "45 Residential Avenue, Surulere, Lagos, Nigeria",
  //             shortAddress: "Surulere, Lagos",
  //             placeId: "chIJz2w_seed_dropoff_id",
  //             tag: "home",
  //           },
  //           itemPhotosUrl: "https://example.com/item.jpg",
  //         },
  //       },
  //     ],
  //   },
  // });

  // const targetEmail = "kizzy.ok99@gmail.com";

  // const vendor = await prisma.vendor.findUnique({
  //   where: { email: targetEmail },
  // });

  // if (vendor) {
  //   await prisma.wallet.upsert({
  //     where: { vendorId: vendor.id },
  //     update: { balance: 3000000.0 },
  //     create: {
  //       vendorId: vendor.id,
  //       balance: 3000000.0,
  //       currency: "NGN",
  //     },
  //   });
  // }

  // const rider = await prisma.rider.findUnique({
  //   where: { email: targetEmail },
  // });

  // if (rider) {
  //   await prisma.wallet.upsert({
  //     where: { riderId: rider.id },
  //     update: { balance: 3000000.0 },
  //     create: {
  //       riderId: rider.id,
  //       balance: 3000000.0,
  //       currency: "NGN",
  //     },
  //   });
  // }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
