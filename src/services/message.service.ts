import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { UserRole, MessageStatus } from "@prisma/client";

export class MessageService {
  static async getOrCreateRoom(customerId: string, vendorId: string) {
    try {
      let room = await prisma.messageRoom.findUnique({
        where: {
          customerId_vendorId: {
            customerId,
            vendorId,
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      });

      if (!room) {
        room = await prisma.messageRoom.create({
          data: {
            customerId,
            vendorId,
          },
          include: {
            messages: true,
          },
        });
      }

      logger.info(
        `Message room fetched/created for customer ${customerId} and vendor ${vendorId}`,
      );
      return room;
    } catch (error) {
      logger.error("Error getting or creating message room:", error);
      throw error;
    }
  }

  static async createMessage(data: {
    roomId: string;
    senderId: string;
    senderType: UserRole;
    content: string;
  }) {
    try {
      const message = await prisma.message.create({
        data: {
          roomId: data.roomId,
          senderId: data.senderId,
          senderType: data.senderType,
          content: data.content,
          status: MessageStatus.SENT,
        },
      });

      logger.info(`Message created in room ${data.roomId}`);
      return message;
    } catch (error) {
      logger.error("Error creating message:", error);
      throw error;
    }
  }

  static async markMessageAsRead(messageId: string) {
    try {
      const message = await prisma.message.update({
        where: { id: messageId },
        data: { status: MessageStatus.READ },
      });

      logger.info(`Message ${messageId} marked as read`);
      return message;
    } catch (error) {
      logger.error("Error marking message as read:", error);
      throw error;
    }
  }

  static async markRoomMessagesAsRead(roomId: string) {
    try {
      await prisma.message.updateMany({
        where: {
          roomId,
          status: { not: MessageStatus.READ },
        },
        data: {
          status: MessageStatus.READ,
        },
      });

      logger.info(`All messages in room ${roomId} marked as read`);
    } catch (error) {
      logger.error("Error marking room messages as read:", error);
      throw error;
    }
  }

  static async getRoomMessages(
    roomId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    try {
      const messages = await prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return messages.reverse();
    } catch (error) {
      logger.error("Error fetching room messages:", error);
      throw error;
    }
  }

  static async getUserConversations(userId: string, userType: UserRole) {
    try {
      let conversations;

      if (userType === UserRole.CUSTOMER) {
        conversations = await prisma.messageRoom.findMany({
          where: { customerId: userId },
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                profilePhotoUrl: true,
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        });
      } else if (userType === UserRole.VENDOR) {
        conversations = await prisma.messageRoom.findMany({
          where: { vendorId: userId },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        });
      }

      return conversations || [];
    } catch (error) {
      logger.error("Error fetching user conversations:", error);
      throw error;
    }
  }

  static async deleteMessage(messageId: string) {
    try {
      await prisma.message.delete({
        where: { id: messageId },
      });

      logger.info(`Message ${messageId} deleted`);
    } catch (error) {
      logger.error("Error deleting message:", error);
      throw error;
    }
  }
}

export const messageService = MessageService;
