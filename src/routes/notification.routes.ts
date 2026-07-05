import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get paginated notifications
 *     description: Retrieve all notifications specific to the authenticated user and their current platform context role.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Maximum number of notification records to return.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         required: false
 *         description: Number of records to skip for pagination offsets.
 *     responses:
 *       200:
 *         description: Paginated notification list and metadata returned successfully.
 *       401:
 *         description: Unauthorized access token missing or malformed.
 *       500:
 *         description: Internal server error.
 */
router.get("/", authMiddleware, NotificationController.getNotifications);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     description: Updates the status of a specific notification document to read status.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hexadecimal unique identifier object reference for the target notification record.
 *     responses:
 *       200:
 *         description: Targeted notification updated successfully.
 *       401:
 *         description: Unauthorized access token missing or malformed.
 *       403:
 *         description: Action forbidden due to cross-tenant entity ownership failure.
 *       404:
 *         description: Targeted notification entity reference not found.
 *       500:
 *         description: Internal server error.
 */
router.patch(
  "/:notificationId/read",
  authMiddleware,
  NotificationController.markAsRead,
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all tenant scope notifications as read
 *     description: Transitions all outstanding unread notifications owned by the active user to a true read state.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of tracking document identifiers updated successfully.
 *       401:
 *         description: Unauthorized access token missing or malformed.
 *       500:
 *         description: Internal server error.
 */
router.patch("/read-all", authMiddleware, NotificationController.markAllAsRead);

export const notificationRouter = router;
