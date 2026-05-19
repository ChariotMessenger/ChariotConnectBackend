import { Router } from "express";
import { MessageController } from "../controllers/message.controller";
import { authMiddleware } from "../middlewares/auth";
const router = Router();

router.use(authMiddleware);
/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message
 *     description: Sends a message within an existing chat room or initializes a new room dynamically via a recipient user ID.
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderType
 *               - content
 *             properties:
 *               roomId:
 *                 type: string
 *                 example: "65f1abcd1234567890abcdef"
 *               recipientId:
 *                 type: string
 *                 example: "65f1bbbb1234567890abcdef"
 *               senderType:
 *                 type: string
 *                 enum: [CUSTOMER, VENDOR]
 *                 example: "CUSTOMER"
 *               content:
 *                 type: string
 *                 example: "Hello, I would like to inquire about your service."
 *               sentByAi:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Message sent and processed successfully
 *       500:
 *         description: Internal server error
 */
router.post("/message", MessageController.sendMessage);

/**
 * @swagger
 * /messages/vendor/conversations:
 *   get:
 *     summary: Get vendor chat rooms
 *     description: Retrieves all active message channels where the authenticated profile acts as the vendor layer.
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of vendor active rooms returned successfully
 *       500:
 *         description: Internal server error
 */
router.get("/vendor/conversations", MessageController.getMessages);

/**
 * @swagger
 * /messages/customer/conversations:
 *   get:
 *     summary: Get customer chat rooms
 *     description: Retrieves all active message channels where the authenticated profile acts as the customer layer.
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of customer active rooms returned successfully
 *       500:
 *         description: Internal server error
 */
router.get("/customer/conversations", MessageController.getConversations);

/**
 * @swagger
 * /messages/room/{roomId}/messages:
 *   get:
 *     summary: Fetch historical room data
 *     description: Provides paginated scroll historical messages logs inside a target conversation wrapper window.
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f1abcd1234567890abcdef"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Historical message structures array returned safely
 *       500:
 *         description: Internal server error
 */
router.get("/room/:roomId/messages", MessageController.getRoomMessages);

/**
 * @swagger
 * /messages/message/{messageId}:
 *   delete:
 *     summary: Purge or unsend single document
 *     description: Removes a message document by matching database reference checks against authorization owners tracking flags.
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f1eeff1234567890abcdef"
 *     responses:
 *       200:
 *         description: Single chat entry cleared from database state references safely
 *       403:
 *         description: Unauthorized deletion access action request failure
 *       500:
 *         description: Internal server error
 */
router.delete("/message/:messageId", MessageController.deleteMessage);

/**
 * @swagger
 * /messages/vendor/reviews:
 *   get:
 *     summary: Get vendor context feedback logs
 *     description: Internal extraction utility processing contextual review references metrics.
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Structured review properties bundle payload returned
 *       500:
 *         description: Internal server error
 */
router.get("/vendor/reviews", MessageController.getVendorReviews);

export const messageRouter = router;
