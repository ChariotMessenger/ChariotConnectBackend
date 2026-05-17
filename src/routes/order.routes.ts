import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management and delivery tracking
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order (Customer)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - totalAmount
 *               - deliveryLocation
 *               - packsList
 *             properties:
 *               vendorId:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               deliveryLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   locationName:
 *                     type: string
 *               packsList:
 *                 type: array
 *                 description: Grouped list of items arranged in packs
 *                 items:
 *                   type: object
 *                   properties:
 *                     packLabel:
 *                       type: string
 *                     itemList:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           itemName:
 *                             type: string
 *                           productImageUrl:
 *                             type: string
 *                             nullable: true
 *                           price:
 *                             type: number
 *                           quantity:
 *                             type: integer
 *                           description:
 *                             type: string
 *                             nullable: true
 *     responses:
 *       201:
 *         description: Order created. Status set to WAITING_FOR_APPROVAL.
 */
router.post("/", authMiddleware, OrderController.createOrder);

/**
 * @swagger
 * /orders/{orderId}:
 *   put:
 *     summary: Update an existing order before payment (Customer)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               deliveryLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   locationName:
 *                     type: string
 *               packsList:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     packLabel:
 *                       type: string
 *                     itemList:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           itemName:
 *                             type: string
 *                           productImageUrl:
 *                             type: string
 *                             nullable: true
 *                           price:
 *                             type: number
 *                           quantity:
 *                             type: integer
 *                           description:
 *                             type: string
 *                             nullable: true
 *     responses:
 *       200:
 *         description: Order modified successfully.
 *       400:
 *         description: Order has already been processed or status does not permit modifications.
 *       403:
 *         description: Unauthorized access to this resource.
 *       404:
 *         description: Target order data could not be located.
 */
router.put("/:orderId", authMiddleware, OrderController.updateOrder);

/**
 * @swagger
 * /orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (Vendor/Rider)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - AWAITING_PAYMENT
 *                   - VENDOR_PACKING
 *                   - AWAITING_PICK_UP
 *                   - REJECTED
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch(
  "/:orderId/status",
  authMiddleware,
  OrderController.vendorUpdateStatus,
);

/**
 * @swagger
 * /orders/payment/initiate:
 *   post:
 *     summary: Initiate payment via Paystack (NGN) or PawaPay (RWF)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment initialized with provider data or URL
 */
router.post(
  "/payment/initiate",
  authMiddleware,
  OrderController.initiatePayment,
);

/**
 * @swagger
 * /orders/payment/verify:
 *   get:
 *     summary: Verify payment status
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - PAYSTACK
 *             - PAWAPAY
 *     responses:
 *       200:
 *         description: Payment verified and status moved to PAID
 */
router.get("/payment/verify", OrderController.verifyPayment);

/**
 * @swagger
 * /orders/{orderId}/accept-job:
 *   post:
 *     summary: Rider accepts an order for delivery
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order assigned to rider
 */
router.post(
  "/:orderId/accept-job",
  authMiddleware,
  OrderController.riderAccept,
);

/**
 * @swagger
 * /orders/{orderId}/pickup:
 *   post:
 *     summary: Rider confirms pickup from vendor
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pickup confirmed and pickupAt timestamp set
 */
router.post("/:orderId/pickup", authMiddleware, OrderController.riderPickup);

/**
 * @swagger
 * /orders/deliver:
 *   post:
 *     summary: Finalize delivery (Rider enters Order ID)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order marked as DELIVERED and deliveredAt timestamp set
 */
router.post("/deliver", authMiddleware, OrderController.riderDeliver);

export default router;
