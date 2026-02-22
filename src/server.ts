import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { prisma } from "./lib/prisma";
// import { initializeSocket } from "./services/socket.service";

dotenv.config();

const PORT = process.env.SERVER_PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to database");

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // initializeSocket(io);

    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
      console.log(`WebSocket server listening for real-time events`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
