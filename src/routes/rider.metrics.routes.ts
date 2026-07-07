import { Router } from "express";
import { RiderMetricsController } from "../controllers/rider.metrics.controller";
import { authMiddleware } from "../middlewares/auth";
const router = Router();

/**
 * @swagger
 * /metrics/rider/today:
 *   get:
 *     summary: Get Rider Current Day Statistics
 *     description: Retrieve the total money earned and total delivery jobs completed today for the authenticated rider.
 *     tags:
 *       - Rider Financials
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's metrics computed and returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Today's metrics fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMoneyEarned:
 *                       type: number
 *                       example: 4500.5
 *                     totalJobsDone:
 *                       type: integer
 *                       example: 3
 *                     currency:
 *                       type: string
 *                       example: NGN
 *                     date:
 *                       type: string
 *                       example: "2026-07-07"
 *       401:
 *         description: Unauthorized access token missing or malformed.
 */
router.get(
  "/rider/today",
  authMiddleware,
  RiderMetricsController.getTodayStats,
);
export const metricsRouter = router;
