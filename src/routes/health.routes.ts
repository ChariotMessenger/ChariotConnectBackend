import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health Check
 *     description: Check if the server is running
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("/", (req: Request, res: Response) => {
  logger.info("Health check request");
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

export default router;
