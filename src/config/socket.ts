import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { messageService } from "../services/message.service";
import { RiderMetricsService } from "../services/rider.metrics.service";
interface ConnectedUsers {
  [userId: string]: string;
}

const connectedUsers: ConnectedUsers = {};
export let ioInstance: SocketIOServer | null = null;

export const initializeSocketIO = (io: SocketIOServer) => {
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on("user:online", (data) => {
      const { userId, userType } = data;
      connectedUsers[userId] = socket.id;
      socket.join(`user:${userId}`);

      socket.data.userId = userId;
      socket.data.userType = userType;

      logger.info(`User ${userId} (${userType}) is online`);
    });

    socket.on("wallet:join", (data) => {
      const { ownerId } = data;
      socket.join(`wallet:${ownerId}`);
      logger.info(
        `Socket ${socket.id} joined wallet synchronization updates for entity: ${ownerId}`,
      );

      socket.emit("wallet:joined", { ownerId, status: "success" });
    });

    socket.on("order:join-room", (data) => {
      const { orderId, userId } = data;
      const roomName = `order:${orderId}`;

      socket.join(roomName);
      logger.info(
        `Socket ${socket.id} joined tracking room for order ${orderId}`,
      );

      socket.to(roomName).emit("order:user-joined", { orderId, userId });
    });

    socket.on("order:leave-room", (data) => {
      const { orderId, userId } = data;
      const roomName = `order:${orderId}`;

      socket.leave(roomName);
      logger.info(
        `Socket ${socket.id} left tracking room for order ${orderId}`,
      );

      socket.to(roomName).emit("order:user-left", { orderId, userId });
    });

    socket.on("message:join-room", (data) => {
      const { roomId, userId } = data;
      const roomName = `room:${roomId}`;

      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined room ${roomId}`);

      socket.to(roomName).emit("message:user-joined", { roomId, userId });
    });

    socket.on("message:leave-room", (data) => {
      const { roomId, userId } = data;
      const roomName = `room:${roomId}`;

      socket.leave(roomName);
      logger.info(`Socket ${socket.id} left room ${roomId}`);

      socket.to(roomName).emit("message:user-left", { roomId, userId });
    });

    socket.on("message:send", async (data) => {
      try {
        const {
          roomId,
          recipientId,
          senderId,
          orderId,
          senderType,
          content,
          sentByAi,
        } = data;

        const message = await messageService.createMessage({
          roomId,
          recipientId,
          senderId,
          senderType,
          content,
          sentByAi,
        });

        socket.join(`room:${message.roomId}`);

        io.to(`room:${message.roomId}`).emit("message:received", message);
        logger.info(`Message processed in room ${message.roomId}`);
      } catch (error) {
        logger.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("message:read", async (data) => {
      try {
        const { roomId, userId } = data;

        const readData = await messageService.markRoomMessagesAsRead(
          roomId,
          userId,
        );

        if (readData.updatedIds.length > 0) {
          io.to(`room:${roomId}`).emit("message:status-updated", {
            roomId,
            readAt: readData.readAt,
            messageIds: readData.updatedIds,
            status: "READ",
          });
        }
      } catch (error) {
        logger.error("Error marking messages as read:", error);
      }
    });

    socket.on("message:typing", (data) => {
      const { roomId, userId } = data;
      socket.broadcast.to(`room:${roomId}`).emit("message:user-typing", {
        userId,
      });
    });

    socket.on("message:stop-typing", (data) => {
      const { roomId, userId } = data;
      socket.broadcast.to(`room:${roomId}`).emit("message:user-stop-typing", {
        userId,
      });
    });

    socket.on("disconnecting", () => {
      const userId = socket.data.userId;
      if (userId) {
        socket.rooms.forEach((room) => {
          if (room.startsWith("room:")) {
            const roomId = room.replace("room:", "");
            socket.to(room).emit("message:user-left", { roomId, userId });
          } else if (room.startsWith("order:")) {
            const orderId = room.replace("order:", "");
            socket.to(room).emit("order:user-left", { orderId, userId });
          }
        });
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId && connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        logger.info(`User ${userId} is offline`);
      }
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  logger.info("Socket.IO initialized");
};

export const getConnectedUsers = () => connectedUsers;

export const emitToUser = (userId: string, eventName: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(eventName, data);
  }
};

export const emitToOrderRoom = (
  orderId: string,
  eventName: string,
  data: any,
) => {
  if (ioInstance) {
    ioInstance.to(`order:${orderId}`).emit(eventName, data);
  }
};

export const emitToAllRiders = (eventName: string, data: any) => {
  if (ioInstance) {
    ioInstance.emit(eventName, data);
  }
};

export const emitWalletBalanceUpdate = (
  ownerId: string,
  balance: number,
  currency: string,
  totalPendingWithdrawal: number,
) => {
  if (ioInstance) {
    ioInstance.to(`wallet:${ownerId}`).emit("wallet:balance-updated", {
      balance,
      currency,
      totalPendingWithdrawal,
      updatedAt: new Date(),
    });
  }
};
export const emitRiderTodayStatsUpdate = async (riderId: string) => {
  if (ioInstance) {
    try {
      const stats = await RiderMetricsService.getRiderTodayStats(riderId);
      ioInstance.to(`user:${riderId}`).emit("rider:today-stats-updated", stats);
    } catch (error) {
      logger.error("Failed to push real-time metric update", error);
    }
  }
};
