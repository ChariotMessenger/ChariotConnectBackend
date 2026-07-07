import { Router } from "express";
import { NotificationController } from "../controllers/push-notification.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /push-notifications/device/register:
 *   post:
 *     summary: Register Device Push Token
 *     description: Links an FCM device registration token to the current authenticated user session.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - userType
 *             properties:
 *               token:
 *                 type: string
 *                 example: "bk3RNwTe3H0:CI2k_HHg..."
 *               userType:
 *                 type: string
 *                 enum:
 *                   - CUSTOMER
 *                   - VENDOR
 *                   - RIDER
 *                 example: CUSTOMER
 *     responses:
 *       200:
 *         description: Token mapped successfully.
 *       401:
 *         description: Missing or unauthorized auth signature tokens.
 */
router.post(
  "/device/register",
  authMiddleware,
  NotificationController.registerToken,
);

export const pushNotificationRoutes = router;
