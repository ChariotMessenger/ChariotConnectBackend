import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

export const notificationService = {
  async getNotifications(
    userId: string,
    userRole: "CUSTOMER" | "VENDOR" | "RIDER",
    limit: number,
    offset: number,
  ) {
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, userRole: userRole as UserRole },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({
        where: { userId, userRole: userRole as UserRole },
      }),
      prisma.notification.count({
        where: { userId, userRole: userRole as UserRole, isRead: false },
      }),
    ]);

    return {
      notifications,
      meta: {
        totalCount,
        unreadCount,
        limit,
        offset,
        hasNextPage: offset + limit < totalCount,
      },
    };
  },

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new Error("Unauthorized to access this notification");
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  async markAllAsRead(
    userId: string,
    userRole: "CUSTOMER" | "VENDOR" | "RIDER",
  ) {
    const timestamp = new Date();

    const targetNotifications = await prisma.notification.findMany({
      where: {
        userId,
        userRole: userRole as UserRole,
        isRead: false,
      },
      select: { id: true },
    });

    const targetIds = targetNotifications.map((n) => n.id);

    if (targetIds.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: targetIds },
        },
        data: {
          isRead: true,
          readAt: timestamp,
        },
      });
    }

    return {
      readAt: timestamp,
      updatedIds: targetIds,
    };
  },
};
