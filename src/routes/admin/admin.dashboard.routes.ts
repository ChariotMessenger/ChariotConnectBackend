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

// Dashboard & Stats
adminDashboardRouter.get(
  "/dashboard/stats",
  authenticateAdmin,
  dashboardController.getStats,
);

// Transaction Routes
/**
 * @swagger
 * /admin/transactions:
 *   get:
 *     summary: Get all platform transactions
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED]
 */
adminDashboardRouter.get(
  "/transactions",
  authenticateAdmin,
  dashboardController.getTransactions,
);

/**
 * @swagger
 * /admin/transactions/{id}:
 *   get:
 *     summary: Get specific transaction breakdown
 *     tags: [Admin Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
adminDashboardRouter.get(
  "/transactions/:id",
  authenticateAdmin,
  dashboardController.getTransactionDetail,
);

// Order Routes
/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all platform orders
 *     tags: [Admin Dashboard]
 */
adminDashboardRouter.get(
  "/orders",
  authenticateAdmin,
  dashboardController.getOrders,
);

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     summary: Get full order and delivery details
 *     tags: [Admin Dashboard]
 */
adminDashboardRouter.get(
  "/orders/:id",
  authenticateAdmin,
  dashboardController.getOrderDetail,
);

// Pricing Configuration
/**
 * @swagger
 * /admin/pricing:
 *   patch:
 *     summary: Update platform fees and cuts
 *     tags: [Admin Dashboard]
 */
adminDashboardRouter.patch(
  "/pricing",
  authenticateAdmin,
  dashboardController.updatePricing,
);

// Verification Routes
adminDashboardRouter.get(
  "/verifications",
  authenticateAdmin,
  verificationController.getRequests,
);

export default adminDashboardRouter;
