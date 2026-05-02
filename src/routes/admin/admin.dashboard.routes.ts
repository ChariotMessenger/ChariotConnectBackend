import { Router } from "express";
import { DashboardController } from "../../controllers/admin/admin.dashboard.controller";
import { VerificationController } from "../../controllers/admin/admin.verification.controller";
import { authenticateAdmin } from "../../middlewares/adminAuth";

const adminDashboardRouter = Router();
const dashboardController = new DashboardController();
const verificationController = new VerificationController();

/**
 * @swagger
 * tags:
 *   - name: Admin Dashboard
 *     description: Real-time platform overview and activity tracking
 *   - name: Admin Verifications
 *     description: Management of Vendor and Rider approval processes
 */

// Dashboard Routes
/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Get high-level platform metrics and recent activity
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
adminDashboardRouter.get(
  "/dashboard/stats",
  authenticateAdmin,
  dashboardController.getStats,
);

// Verification Routes
/**
 * @swagger
 * /admin/verifications:
 *   get:
 *     summary: Get paginated list of pending verifications for Vendors or Riders
 *     tags: [Admin Verifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [VENDOR, RIDER]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid type provided
 */
adminDashboardRouter.get(
  "/verifications",
  authenticateAdmin,
  verificationController.getRequests,
);

export default adminDashboardRouter;
