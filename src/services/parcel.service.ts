import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import axios from "axios";
import { RouteUtility } from "../utils/route.util";

const prisma = new PrismaClient();

export class ParcelDeliveryService {
  static async initializeParcelDelivery(data: {
    customerId: string;
    pickupLocation: any;
    expectedPickupTime: string;
    deliveryStops: Array<{ label: string; stopInfo: any }>;
    currency?: string;
    note?: string;
  }) {
    const config = await prisma.pricingConfiguration.findFirst();
    if (!config) throw new Error("Pricing configuration missing");

    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) throw new Error("Customer profile not found");

    const stopCoordinates = data.deliveryStops.map((s) => ({
      latitude: s.stopInfo.stopLocation.latitude,
      longitude: s.stopInfo.stopLocation.longitude,
    }));

    const totalDistance = await RouteUtility.calculateTotalDistance(
      {
        latitude: data.pickupLocation.latitude,
        longitude: data.pickupLocation.longitude,
      },
      stopCoordinates,
    );

    const baseRatePerKm = 120.0;
    const computedDeliveryFee = Math.max(1000.0, totalDistance * baseRatePerKm);
    const calculatedProtectionFee = config.orderProtectionFee;
    const finalAmountToPay =
      computedDeliveryFee + calculatedProtectionFee + config.orderProcessingFee;

    const modifiedStops = data.deliveryStops.map((stop) => ({
      label: stop.label,
      stopInfo: {
        ...stop.stopInfo,
        confirmationKey: `CONF-${crypto.randomInt(1000, 9999)}`,
        isDelivered: false,
        timeDelivered: null,
      },
    }));

    const deliveryRecord = await prisma.deliverPackageData.create({
      data: {
        customerId: data.customerId,
        status: "WAITING_FOR_RIDER_TO_ACCEPT",
        currency: data.currency || "NGN",
        avgDistanceKm: totalDistance.toFixed(1),
        note: data.note,
        pickupSummary: {
          pickupSecretKey: `SEC-${crypto.randomInt(1000, 9999)}`,
          pickupLocation: data.pickupLocation,
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
        { headers: { Authorization: `Bearer ${process.env.PAWAPAY_SECRET}` } },
      );
      return { provider: "PAWAPAY", data: gatewayResponse.data };
    } else {
      const gatewayResponse = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: Math.round(totalAmount * 100),
          currency: parcel.currency,
          metadata: { parcelId },
        },
        { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } },
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

  static async listAvailableDeliveries() {
    return prisma.deliverPackageData.findMany({
      where: { status: "WAITING_FOR_RIDER_TO_ACCEPT" },
    });
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
