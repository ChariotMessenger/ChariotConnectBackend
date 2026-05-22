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
    return await prisma.message.findMany({
      where: { roomId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });
  },

  async getUserConversations(userId: string, role: "VENDOR" | "CUSTOMER") {
    const rooms = await prisma.messageRoom.findMany({
      where: role === "VENDOR" ? { vendorId: userId } : { customerId: userId },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
        vendor: {
          select: {
            businessName: true,
            brandLogoUrl: true,
            coverPhotoUrl: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const roomIds = rooms.map((room) => room.id);

    const unreadCounts = await prisma.message.groupBy({
      by: ["roomId"],
      where: {
        roomId: { in: roomIds },
        isRead: false,
        senderId: { not: userId },
      },
      _count: {
        id: true,
      },
    });

    const unreadCountMap = new Map(
      unreadCounts.map((item) => [item.roomId, item._count.id]),
    );

    return rooms.map((room) => {
      const { customer, vendor, ...roomData } = room;
      return {
        ...roomData,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerProfileUrl: customer.profilePhotoUrl,
        vendorBusinessName: vendor.businessName,
        vendorBrandLogoUrl: vendor.brandLogoUrl,
        vendorCoverPhotoUrl: vendor.coverPhotoUrl,
        unreadCount: unreadCountMap.get(room.id) || 0,
      };
    });
  },
};
