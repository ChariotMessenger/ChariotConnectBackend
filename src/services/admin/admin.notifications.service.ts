import { PrismaClient, UserRole, UserType } from "@prisma/client";
import { NotificationService } from "../notification.service";
const prisma = new PrismaClient();

const mapRoleToType = (role: "CUSTOMER" | "VENDOR" | "RIDER"): UserType => {
  if (role === "CUSTOMER") return UserType.CUSTOMER;
  if (role === "VENDOR") return UserType.VENDOR;
  return UserType.RIDER;
};

export const adminNotificationService = {
  async createNotification(data: {
    userId: string;
    userRole: "CUSTOMER" | "VENDOR" | "RIDER";
    title: string;
    body: string;
    clickableLinks?: string[];
    iconUrl?: string | null;
  }) {
    const payload: any = {
      userId: data.userId,
      userRole: data.userRole as UserRole,
      title: data.title,
      body: data.body,
      clickableLinks: data.clickableLinks ?? [],
      iconUrl: data.iconUrl ?? null,
    };

    if (data.userRole === "CUSTOMER")
      payload.customer = { connect: { id: data.userId } };
    if (data.userRole === "VENDOR")
      payload.vendor = { connect: { id: data.userId } };
    if (data.userRole === "RIDER")
      payload.rider = { connect: { id: data.userId } };

    const notification = await prisma.notification.create({
      data: payload,
    });

    try {
      await NotificationService.sendPushNotification(
        data.userId,
        mapRoleToType(data.userRole),
        { title: data.title, body: data.body },
      );
    } catch (e) {}

    return notification;
  },

  async broadcastNotification(data: {
    target: "CUSTOMER" | "VENDOR" | "RIDER" | "ALL";
    title: string;
    body: string;
    clickableLinks?: string[];
    iconUrl?: string | null;
  }) {
    const targetRoles =
      data.target === "ALL" ? ["CUSTOMER", "VENDOR", "RIDER"] : [data.target];

    const queries: Promise<any[]>[] = [];

    if (targetRoles.includes("CUSTOMER")) {
      queries.push(prisma.customer.findMany({ select: { id: true } }));
    }
    if (targetRoles.includes("VENDOR")) {
      queries.push(prisma.vendor.findMany({ select: { id: true } }));
    }
    if (targetRoles.includes("RIDER")) {
      queries.push(prisma.rider.findMany({ select: { id: true } }));
    }

    const results = await Promise.all(queries);
    const notificationsToCreate: any[] = [];
    let queryIndex = 0;

    if (targetRoles.includes("CUSTOMER")) {
      const customers = results[queryIndex++];
      customers.forEach((user) => {
        notificationsToCreate.push({
          userId: user.id,
          userRole: UserRole.CUSTOMER,
          title: data.title,
          body: data.body,
          clickableLinks: data.clickableLinks ?? [],
          iconUrl: data.iconUrl ?? null,
        });
      });
    }

    if (targetRoles.includes("VENDOR")) {
      const vendors = results[queryIndex++];
      vendors.forEach((user) => {
        notificationsToCreate.push({
          userId: user.id,
          userRole: UserRole.VENDOR,
          title: data.title,
          body: data.body,
          clickableLinks: data.clickableLinks ?? [],
          iconUrl: data.iconUrl ?? null,
        });
      });
    }

    if (targetRoles.includes("RIDER")) {
      const riders = results[queryIndex++];
      riders.forEach((user) => {
        notificationsToCreate.push({
          userId: user.id,
          userRole: UserRole.RIDER,
          title: data.title,
          body: data.body,
          clickableLinks: data.clickableLinks ?? [],
          iconUrl: data.iconUrl ?? null,
        });
      });
    }

    if (notificationsToCreate.length > 0) {
      const result = await prisma.notification.createMany({
        data: notificationsToCreate,
      });

      for (const notification of notificationsToCreate) {
        try {
          await NotificationService.sendPushNotification(
            notification.userId,
            mapRoleToType(notification.userRole),
            { title: notification.title, body: notification.body },
          );
        } catch (e) {}
      }

      return result;
    }

    return { count: 0 };
  },

  async getAllNotifications(limit: number, offset: number) {
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count(),
    ]);

    return {
      notifications,
      meta: {
        totalCount,
        limit,
        offset,
        hasNextPage: offset + limit < totalCount,
      },
    };
  },
};
