import http from "http";
import app from "./app";
import { logger } from "./utils/logger";
import { Server as SocketIOServer } from "socket.io";
import { initializeSocketIO } from "./config/socket";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || "http://localhost:3001",
    credentials: true,
  },
});

initializeSocketIO(io);

// Attach io to app for use in routes
(app as any).io = io;

server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

process.on("unhandledRejection", (reason: Error) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

export default server;
