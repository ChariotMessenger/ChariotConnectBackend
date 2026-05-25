import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { messageService } from "../services/message.service";

interface ConnectedUsers {
  [userId: string]: string;
}

const connectedUsers: ConnectedUsers = {};
let ioInstance: SocketIOServer | null = null;

export const initializeSocketIO = (io: SocketIOServer) => {
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on("user:online", (data) => {
      const { userId, userType } = data;
      connectedUsers[userId] = socket.id;
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} (${userType}) is online`);
    });

    socket.on("order:join-room", (data) => {
      const { orderId } = data;
      socket.join(`order:${orderId}`);
      logger.info(
        `Socket ${socket.id} joined tracking room for order ${orderId}`,
      );
    });

    socket.on("message:join-room", (data) => {
      const { roomId } = data;
      socket.join(`room:${roomId}`);
      logger.info(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("message:send", async (data) => {
      try {
        const { roomId, recipientId, senderId, senderType, content, sentByAi } =
          data;

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

    socket.on("disconnect", () => {
      Object.keys(connectedUsers).forEach((userId) => {
        if (connectedUsers[userId] === socket.id) {
          delete connectedUsers[userId];
          logger.info(`User ${userId} is offline`);
        }
      });
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
