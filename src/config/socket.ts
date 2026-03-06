import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { messageService } from "../services/message.service";
interface ConnectedUsers {
  [userId: string]: string; // userId -> socketId
}

const connectedUsers: ConnectedUsers = {};

export const initializeSocketIO = (io: SocketIOServer) => {
  io.on("connection", (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // User comes online
    socket.on("user:online", (data) => {
      const { userId, userType } = data;
      connectedUsers[userId] = socket.id;
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} (${userType}) is online`);
    });

    // Join message room
    socket.on("message:join-room", (data) => {
      const { roomId } = data;
      socket.join(`room:${roomId}`);
      logger.info(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Send message
    socket.on("message:send", async (data) => {
      try {
        const { roomId, senderId, senderType, content } = data;

        // Save message to database
        const message = await messageService.createMessage({
          roomId,
          senderId,
          senderType,
          content,
        });

        // Broadcast to room
        io.to(`room:${roomId}`).emit("message:received", message);
        logger.info(`Message sent in room ${roomId}`);
      } catch (error) {
        logger.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Mark message as read
    socket.on("message:read", async (data) => {
      try {
        const { messageId, roomId } = data;
        await messageService.markMessageAsRead(messageId);
        io.to(`room:${roomId}`).emit("message:status-updated", {
          messageId,
          status: "READ",
        });
      } catch (error) {
        logger.error("Error marking message as read:", error);
      }
    });

    // User typing
    socket.on("message:typing", (data) => {
      const { roomId, userId } = data;
      socket.broadcast.to(`room:${roomId}`).emit("message:user-typing", {
        userId,
      });
    });

    // User stops typing
    socket.on("message:stop-typing", (data) => {
      const { roomId, userId } = data;
      socket.broadcast.to(`room:${roomId}`).emit("message:user-stop-typing", {
        userId,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      // Remove user from connected users
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
