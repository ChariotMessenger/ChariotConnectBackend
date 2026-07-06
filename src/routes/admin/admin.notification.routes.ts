import { Router } from "express";
import {
  handleCreateDirectNotification,
  handleBroadcastNotification,
  handleGetAllNotifications,
} from "../../controllers/admin/admin.notification.controller";
import { authenticateAdmin } from "../../middlewares/adminAuth";

const router = Router();

/**
 * @swagger
 * /admin/notifications/direct:
 *   post:
 *     summary: Send Direct Notification to Specific User
 *     description: Creates a target user instance notification mapped by specific system role permissions.
 *     tags:
 *       - Admin Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userRole
 *               - title
 *               - body
 *             properties:
 *               userId:
 *                 type: string
 *               userRole:
 *                 type: string
 *                 enum: [CUSTOMER, VENDOR, RIDER]
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               clickableLinks:
 *                 type: array
 *                 items:
 *                   type: string
 *               iconUrl:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Direct target notification documented successfully.
 *       401:
 *         description: Unauthorized access token.
 *       403:
 *         description: Administrative authorization context required.
 *       500:
 *         description: Internal pipeline exception.
 */
router.post("/direct", authenticateAdmin, handleCreateDirectNotification);

/**
 * @swagger
 * /admin/notifications/broadcast:
 *   post:
 *     summary: Broadcast System Notification across Platforms
 *     description: Triggers massive ingestion mutations deploying targeted notification documents to broad category entities.
 *     tags:
 *       - Admin Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *               - title
 *               - body
 *             properties:
 *               target:
 *                 type: string
 *                 enum: [CUSTOMER, VENDOR, RIDER, ALL]
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               clickableLinks:
 *                 type: array
 *                 items:
 *                   type: string
 *               iconUrl:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Batch mutation metadata object executed successfully.
 *       401:
 *         description: Unauthorized access token.
 *       403:
 *         description: Administrative authorization context required.
 *       500:
 *         description: Internal pipeline exception.
 */
router.post("/broadcast", authenticateAdmin, handleBroadcastNotification);

router.get("/", authenticateAdmin, handleGetAllNotifications);

export const adminNotificationRouter = router;
