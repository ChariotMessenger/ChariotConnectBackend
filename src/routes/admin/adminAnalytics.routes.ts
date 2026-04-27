import { Router } from "express";
import { AdminAnalyticsController } from "../../controllers/admin/adminAnalytics.controller";
import { authenticateAdmin } from "../../middlewares/adminAuth";
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin dashboard and analytics
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get dashboard overview stats
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Analytics object containing totals
 */
router.get("/stats", authenticateAdmin, AdminAnalyticsController.getStats);

/**
 * @swagger
 * /admin/activities:
 *   get:
 *     summary: Get recent app activities (Orders/Payments)
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - PENDING
 *             - ACCEPTED
 *             - REJECTED
 *             - COMPLETED
 *             - CANCELLED
 *     responses:
 *       200:
 *         description: Paginated list of recent activities
 */
router.get(
  "/activities",
  authenticateAdmin,
  AdminAnalyticsController.getActivities,
);

export default router;
