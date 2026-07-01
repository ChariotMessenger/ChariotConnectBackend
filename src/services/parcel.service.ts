import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import axios from "axios";
import { RouteUtility } from "../utils/route.util";
import { UploadService } from "./upload.service";
const prisma = new PrismaClient();

export class ParcelDeliveryService {
  static async checkIfParcelExists(id: string): Promise<boolean> {
    const count = await prisma.deliverPackageData.count({
      where: { id },
    });
    return count > 0;
  }
  static async initializeParcelDelivery(
    data: {
      customerId: string;
      pickupLocation: string;
      expectedPickupTime: string;
      currency?: string;
      note?: string;
      deliveryStops: Array<{
        label: string;
        receiverName: string;
        receiverPhoneNumber: string;
        stopLocation: string;
      }>;
    },
    files: Express.Multer.File[],
  ) {
    const config = await prisma.pricingConfiguration.findFirst();
    if (!config) throw new Error("Pricing configuration missing");

    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) throw new Error("Customer profile not found");

    const parsedPickupLocation = JSON.parse(data.pickupLocation);

    const stopCoordinates = data.deliveryStops.map((s) => {
      const parsedLocation = JSON.parse(s.stopLocation);
      return {
        latitude: parsedLocation.latitude,
        longitude: parsedLocation.longitude,
      };
    });

    const totalDistance = await RouteUtility.calculateTotalDistance(
      {
        latitude: parsedPickupLocation.latitude,
        longitude: parsedPickupLocation.longitude,
      },
      stopCoordinates,
    );

    const baseRatePerKm = 120.0;
    const computedDeliveryFee = Math.max(1000.0, totalDistance * baseRatePerKm);
    const calculatedProtectionFee = config.orderProtectionFee;
    const finalAmountToPay =
      computedDeliveryFee + calculatedProtectionFee + config.orderProcessingFee;

    const generatedParcelId = crypto.randomBytes(12).toString("hex");

    const modifiedStops = await Promise.all(
      data.deliveryStops.map(async (stop, index) => {
        const fileMatch = files.find(
          (f) => f.fieldname === `deliveryStops[${index}][itemPhotosUrl]`,
        );
        if (!fileMatch)
          throw new Error(
            `Missing document dependency binary for ${stop.label}`,
          );

        const itemPhotosUrl = await UploadService.uploadParcelItemPhoto(
          fileMatch,
          generatedParcelId,
          stop.label,
        );

        return {
          label: stop.label,
          stopInfo: {
            receiverName: stop.receiverName,
            receiverPhoneNumber: stop.receiverPhoneNumber,
            confirmationKey: `CONF-${crypto.randomInt(1000, 9999)}`,
            isDelivered: false,
            stopLocation: JSON.parse(stop.stopLocation),
            itemPhotosUrl: itemPhotosUrl,
            timeDelivered: null,
          },
        };
      }),
    );

    const deliveryRecord = await prisma.deliverPackageData.create({
      data: {
        id: generatedParcelId,
        customerId: data.customerId,
        status: "INITIATED",
        currency: data.currency || "NGN",
        avgDistanceKm: totalDistance.toFixed(1),
        note: data.note,
        pickupSummary: {
          pickupSecretKey: `SEC-${crypto.randomInt(1000, 9999)}`,
          pickupLocation: parsedPickupLocation,
          expectedPickupTime: new Date(data.expectedPickupTime),
          deliveryFee: computedDeliveryFee,
          protectionFee: calculatedProtectionFee,
          totalAmountToPay: finalAmountToPay,
        },
        deliveryStops: modifiedStops,
      },
    });

    return deliveryRecord;
  }

  static async generatePaymentLink(parcelId: string, email: string) {
    const parcel = await prisma.deliverPackageData.findUnique({
      where: { id: parcelId },
      include: { customer: { select: { phone: true } } },
    });

    if (!parcel) throw new Error("Delivery pipeline instance unavailable");

    const totalAmount = parcel.pickupSummary.totalAmountToPay;
    const customerPhone = parcel.customer?.phone;

    if (parcel.currency === "RWF") {
      if (!customerPhone)
        throw new Error("RWF routing requires profile telephone index");
      const gatewayResponse = await axios.post(
        "https://api.pawapay.cloud/deposits",
        {
          depositId: parcel.id,
          amount: totalAmount.toString(),
          currency: "RWF",
          correspondent: "MTN_MOMO_RWA",
          payer: { address: { value: customerPhone } },
          customerTimestamp: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAWAPAY_SECRET_KEY}`,
          },
        },
      );
      return { provider: "PAWAPAY", data: gatewayResponse.data };
    } else {
      if (!process.env.PAYSTACK_SECRET_KEY) {
        throw new Error(
          "Paystack integration initialization failed: PAYSTACK_SECRET_KEY environment definition is empty.",
        );
      }

      const gatewayResponse = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: Math.round(totalAmount * 100),
          currency: parcel.currency,
          metadata: { parcelId },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );
      return {
        provider: "PAYSTACK",
        url: gatewayResponse.data.data.authorization_url,
      };
    }
  }
  static async verifyWebhookPayment(reference: string, platform: string) {
    const parcelId = reference;
    const parcel = await prisma.deliverPackageData.findUnique({
      where: { id: parcelId },
    });
    if (!parcel) return;

    await prisma.deliverPackageData.update({
      where: { id: parcelId },
      data: { status: "WAITING_FOR_RIDER_TO_ACCEPT" },
    });
  }

  static async listAvailableDeliveries(
    options: { page?: number; limit?: number } = {},
  ) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit ? Math.min(options.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const [deliveries, total] = await prisma.$transaction([
      prisma.deliverPackageData.findMany({
        where: { status: "WAITING_FOR_RIDER_TO_ACCEPT" },
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
              phone: true,
            },
          },
        },
      }),
      prisma.deliverPackageData.count({
        where: { status: "WAITING_FOR_RIDER_TO_ACCEPT" },
      }),
    ]);

    const formattedData = deliveries.map((delivery) => {
      const { customer, ...rest } = delivery;
      return {
        ...rest,
        pickupSummary: {
          ...rest.pickupSummary,
          customerName: customer
            ? `${customer.firstName} ${customer.lastName}`.trim()
            : "Unknown Customer",
          customerProfilePhotoUrl: customer?.profilePhotoUrl || null,
          customerPhoneNumber: customer?.phone || null,
        },
      };
    });

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async listCustomerDeliveries(options: {
    customerId: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit ? Math.min(options.limit, 100) : 20;
    const skip = (page - 1) * limit;
    const { customerId } = options;

    const [deliveries, total, countsGroup] = await prisma.$transaction([
      prisma.deliverPackageData.findMany({
        where: { customerId },
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.deliverPackageData.count({
        where: { customerId },
      }),
      prisma.deliverPackageData.groupBy({
        by: ["status"],
        where: { customerId },
        _count: { status: true },
      } as any),
    ]);

    const statusCounts = (countsGroup as any[]).reduce(
      (acc, curr) => {
        if (curr && curr.status) {
          acc[curr.status] = curr._count?.status ?? 0;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      data: deliveries,
      statusCounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async listRiderDeliveries(options: {
    riderId: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit ? Math.min(options.limit, 100) : 20;
    const skip = (page - 1) * limit;
    const { riderId } = options;

    const [deliveries, total, countsGroup] = await prisma.$transaction([
      prisma.deliverPackageData.findMany({
        where: { riderId },
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
              phone: true,
            },
          },
        },
      }),
      prisma.deliverPackageData.count({
        where: { riderId },
      }),
      prisma.deliverPackageData.groupBy({
        by: ["status"],
        where: { riderId },
        _count: { status: true },
      } as any),
    ]);

    const statusCounts = (countsGroup as any[]).reduce(
      (acc, curr) => {
        if (curr && curr.status) {
          acc[curr.status] = curr._count?.status ?? 0;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const formattedData = deliveries.map((delivery) => {
      const { customer, ...rest } = delivery;
      return {
        ...rest,
        pickupSummary: {
          ...rest.pickupSummary,
          customerName: customer
            ? `${customer.firstName} ${customer.lastName}`.trim()
            : "Unknown Customer",
          customerProfilePhotoUrl: customer?.profilePhotoUrl || null,
          customerPhoneNumber: customer?.phone || null,
        },
      };
    });

    return {
      data: formattedData,
      statusCounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async acceptDeliveryJob(parcelId: string, riderId: string) {
    const parcel = await prisma.deliverPackageData.findUnique({
      where: { id: parcelId },
    });
    if (!parcel || parcel.status !== "WAITING_FOR_RIDER_TO_ACCEPT") {
      throw new Error("Job allocation no longer active");
    }

    return prisma.deliverPackageData.update({
      where: { id: parcelId },
      data: {
        riderId,
        status: "ACCEPTED",
      },
    });
  }

  static async triggerProgressState(parcelId: string) {
    return prisma.deliverPackageData.update({
      where: { id: parcelId },
      data: {
        status: "DELIVERY_IN_PROGRESS",
        timePickedUp: new Date(),
      },
    });
  }

  static async verifyStopConfirmationKey(
    parcelId: string,
    label: string,
    keyInput: string,
  ) {
    const parcel = await prisma.deliverPackageData.findUnique({
      where: { id: parcelId },
    });
    if (!parcel) throw new Error("Package profile missing");

    const targetList = [...parcel.deliveryStops];
    const matchIndex = targetList.findIndex((stop) => stop.label === label);

    if (matchIndex === -1)
      throw new Error("Target waypoint identifier missing");
    if (targetList[matchIndex].stopInfo.confirmationKey !== keyInput) {
      throw new Error("Verification execution stopped: Key Mismatch");
    }

    targetList[matchIndex].stopInfo.isDelivered = true;
    targetList[matchIndex].stopInfo.timeDelivered = new Date();

    const ongoingMilestones = targetList.filter(
      (stop) => !stop.stopInfo.isDelivered,
    );
    const terminalState =
      ongoingMilestones.length === 0
        ? "ALL_PACKAGE_DELIVERED"
        : "DELIVERY_IN_PROGRESS";

    return prisma.deliverPackageData.update({
      where: { id: parcelId },
      data: {
        deliveryStops: targetList,
        status: terminalState,
        timeCompleted:
          terminalState === "ALL_PACKAGE_DELIVERED" ? new Date() : null,
      },
    });
  }
}
