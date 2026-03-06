import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

export const prisma = new PrismaClient();

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Failed to connect to database:", error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info("Database disconnected");
  } catch (error) {
    logger.error("Failed to disconnect from database:", error);
    throw error;
  }
};
