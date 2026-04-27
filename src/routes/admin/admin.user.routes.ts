import { Router } from "express";
import { AdminUserController } from "../../controllers/admin/admin.user.controller";
import { authenticateAdmin } from "../../middlewares/adminAuth";
const adminRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin User Management
 *     description: Administrative tools for managing Vendors, Riders, and Customers
 */

// Vendor Management
/**
 * @swagger
 * /admin/users/vendors:
 *   get:
 *     summary: List all vendors with filters
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - PENDING
 *             - VERIFIED
 *             - REJECTED
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 */
adminRouter.get(
  "/users/vendors",
  authenticateAdmin,
  AdminUserController.getVendors,
);

// Rider Management
/**
 * @swagger
 * /admin/users/riders:
 *   get:
 *     summary: List all riders with filters
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - PENDING
 *             - VERIFIED
 *             - REJECTED
 *       - in: query
 *         name: onlineStatus
 *         schema:
 *           type: string
 *           enum:
 *             - ONLINE
 *             - OFFLINE
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
adminRouter.get(
  "/users/riders",
  authenticateAdmin,
  AdminUserController.getRiders,
);

// Customer Management
/**
 * @swagger
 * /admin/users/customers:
 *   get:
 *     summary: List all customers with search and pagination
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
adminRouter.get(
  "/users/customers",
  authenticateAdmin,
  AdminUserController.getCustomers,
);

// Verification and Actions
/**
 * @swagger
 * /admin/users/verify/{type}/{id}:
 *   patch:
 *     summary: Verify or Reject a Vendor or Rider account
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - vendor
 *             - rider
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum:
 *                   - VERIFY
 *                   - REJECT
 *     responses:
 *       200:
 *         description: Account updated successfully
 */
adminRouter.patch(
  "/users/verify/:type/:id",
  authenticateAdmin,
  AdminUserController.handleUserVerification,
);

// Deep Detail View
/**
 * @swagger
 * /admin/users/details/{type}/{id}:
 *   get:
 *     summary: Get full account details for any user type
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - vendor
 *             - rider
 *             - customer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
adminRouter.get(
  "/users/details/:type/:id",
  authenticateAdmin,
  AdminUserController.getUserDetails,
);

export default adminRouter;
