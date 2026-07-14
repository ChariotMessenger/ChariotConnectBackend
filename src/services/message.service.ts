import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const messageService = {
  async createMessage(data: {
    roomId?: string;
    recipientId?: string;
    senderId: string;
    senderType: "CUSTOMER" | "VENDOR";
    content: string;
    sentByAi?: boolean;
  }) {
    let targetRoomId = data.roomId;

    if (!targetRoomId) {
      if (!data.recipientId) {
        throw new Error("Either roomId or recipientId must be provided");
      }

      const customerId =
        data.senderType === "CUSTOMER" ? data.senderId : data.recipientId;
      const vendorId =
        data.senderType === "VENDOR" ? data.senderId : data.recipientId;

      const room = await prisma.messageRoom.upsert({
        where: {
          customerId_vendorId: {
            customerId,
            vendorId,
          },
        },
        update: {},
        create: {
          customerId,
          vendorId,
        },
      });

      targetRoomId = room.id;
    }

    return await prisma.message.create({
      data: {
        roomId: targetRoomId,
        senderId: data.senderId,
        senderType: data.senderType,
        content: data.content,
        sentByAi: data.sentByAi ?? false,
        isRead: false,
        sentAt: new Date(),
      },
    });
  },

  async markRoomMessagesAsRead(roomId: string, userId: string) {
    const timestamp = new Date();

    const targetMessages = await prisma.message.findMany({
      where: {
        roomId,
        senderId: { not: userId },
        isRead: false,
      },
      select: { id: true },
    });

    const updatedIds = targetMessages.map((msg) => msg.id);

    if (updatedIds.length > 0) {
      await prisma.message.updateMany({
        where: {
          id: { in: updatedIds },
        },
        data: {
          isRead: true,
          readAt: timestamp,
          status: "READ",
        },
      });
    }

    return {
      readAt: timestamp,
      updatedIds,
    };
  },

  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== userId) {
      throw new Error("Unauthorized to delete this message");
    }

    return await prisma.message.delete({
      where: { id: messageId },
    });
  },

  async getRoomMessages(roomId: string, limit: number, offset: number) {
    const messages = await prisma.message.findMany({
      where: { roomId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    const senderIds = [...new Set(messages.map((m) => m.senderId))];

    const [customers, vendors] = await Promise.all([
      prisma.customer.findMany({
        where: { id: { in: senderIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
        },
      }),
      prisma.vendor.findMany({
        where: { id: { in: senderIds } },
        select: {
          id: true,
          businessName: true,
          brandLogoUrl: true,
          coverPhotoUrl: true,
        },
      }),
    ]);

    const customerMap = new Map(customers.map((c) => [c.id, c]));
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    return messages.map((message) => {
      const customer = customerMap.get(message.senderId);
      const vendor = vendorMap.get(message.senderId);

      return {
        ...message,
        senderName:
          message.senderType === "CUSTOMER"
            ? customer
              ? `${customer.firstName} ${customer.lastName}`
              : "Deleted User"
            : vendor
              ? vendor.businessName
              : "Unknown Vendor",
        senderProfileUrl:
          message.senderType === "CUSTOMER"
            ? customer?.profilePhotoUrl || null
            : vendor?.brandLogoUrl || null,
      };
    });
  },

  async getUserConversations(userId: string, role: "VENDOR" | "CUSTOMER") {
    const rooms = await prisma.messageRoom.findMany({
      where: role === "VENDOR" ? { vendorId: userId } : { customerId: userId },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const roomIds = rooms.map((room) => room.id);
    const customerIds = [...new Set(rooms.map((room) => room.customerId))];
    const vendorIds = [...new Set(rooms.map((room) => room.vendorId))];

    const [customers, vendors, unreadCounts] = await Promise.all([
      prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
        },
      }),
      prisma.vendor.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          businessName: true,
          brandLogoUrl: true,
          coverPhotoUrl: true,
          vendorWorkPeriod: true,
        },
      }),
      prisma.message.groupBy({
        by: ["roomId"],
        where: {
          roomId: { in: roomIds },
          isRead: false,
          senderId: { not: userId },
        },
        _count: { id: true },
      }),
    ]);

    const customerMap = new Map(customers.map((c) => [c.id, c]));
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));
    const unreadCountMap = new Map(
      unreadCounts.map((item) => [item.roomId, item._count.id]),
    );

    return rooms.map((room) => {
      const customer = customerMap.get(room.customerId);
      const vendor = vendorMap.get(room.vendorId);

      return {
        id: room.id,
        customerId: room.customerId,
        vendorId: room.vendorId,
        messages: room.messages,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        customerName: customer
          ? `${customer.firstName} ${customer.lastName}`
          : "Deleted User",
        customerProfileUrl: customer?.profilePhotoUrl || null,
        vendorBusinessName: vendor?.businessName || "Unknown Vendor",
        vendorBrandLogoUrl: vendor?.brandLogoUrl || null,
        vendorCoverPhotoUrl: vendor?.coverPhotoUrl || null,
        vendorWorkPeriod: vendor?.vendorWorkPeriod || null,
        unreadCount: unreadCountMap.get(room.id) || 0,
      };
    });
  },
};
