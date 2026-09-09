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
ssage:join-room", (data) => {
      const { roomId, userId } = data;
      const roomName = `room:${roomId}`;

      socket.join(roomName);
      const stats = await RiderMetricsService.getRiderTodayStats(riderId);
      ioInstance.to(`user:${riderId}`).emit("rider:today-stats-updated", stats);
    } catch (error) {
      logger.error("Failed to push real-time metric update", error);
    }
  }
};
