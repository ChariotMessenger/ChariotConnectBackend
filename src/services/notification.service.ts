import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging, MulticastMessage } from "firebase-admin/messaging";
import { PrismaClient, UserType } from "@prisma/client";
import path from "path";

const prisma = new PrismaClient();

if (getApps().length === 0) {
  const serviceAccountPath = path.resolve(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      "./firebase-service-account.json",
  );

  initializeApp({
    credential: cert(serviceAccountPath),
  });
}

export class NotificationService {
  static async registerDeviceToken(
    userId: string,
    userType: UserType,
    token: string,
  ) {
    const updateData: any = {
      token,
      userType,
    };

    if (userType === UserType.CUSTOMER) updateData.customerId = userId;
    if (userType === UserType.VENDOR) updateData.vendorId = userId;
    if (userType === UserType.RIDER) updateData.riderId = userId;

    await prisma.deviceToken.upsert({
      where: { token },
      update: updateData,
      create: updateData,
    });
  }

  static async sendPushNotification(
    targetId: string,
    userType: UserType,
    payload: { title: string; body: string; data?: Record<string, string> },
  ) {
    const whereClause: any = {};
    if (userType === UserType.CUSTOMER) whereClause.customerId = targetId;
    if (userType === UserType.VENDOR) whereClause.vendorId = targetId;
    if (userType === UserType.RIDER) whereClause.riderId = targetId;

    const deviceTokens = await prisma.deviceToken.findMany({
      where: whereClause,
      select: { token: true },
    });

    if (deviceTokens.length === 0) return;

    const tokens = deviceTokens.map((t) => t.token);

    const message: MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        ...payload.data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const messaging = getMessaging();
    const response = await messaging.sendEachForMulticast(message);

    if (response.failureCount > 0) {
      const tokensToRemove: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success && resp.error) {
          const code = resp.error.code;
          if (
            code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered"
          ) {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        await prisma.deviceToken.deleteMany({
          where: { token: { in: tokensToRemove } },
        });
      }
    }
  }
}
