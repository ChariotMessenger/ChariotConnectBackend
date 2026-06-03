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
 *     tags:
 *       - Orders
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
 *               - deliveryLocation
 *               - estDeliveryTime
 *               - packsList
 *             properties:
 *               vendorId:
 *                 type: string
 *               notes:
 *                 type: string
 *               estDeliveryTime:
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
 *     tags:
 *       - Orders
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
 *               notes:
 *                 type: string
 *               estDeliveryTime:
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
 * /orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel a pending order (Customer)
 *     tags:
 *       - Orders
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
 *         description: Order cancelled successfully
 */
router.post(
  "/:orderId/cancel",
  authMiddleware,
  OrderController.customerCancelOrder,
);
/**
 * @swagger
 * /orders/{orderId}/reject:
 *   post:
 *     summary: Reject a pending order (Vendor)
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: The ID of the order to reject
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order rejected successfully
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
 *                   example: Order rejected successfully
 *       400:
 *         description: Order cannot be rejected from its current status
 *       404:
 *         description: Order not found or unauthorized vendor access
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/:orderId/reject",
  authMiddleware,
  OrderController.vendorRejectOrder,
);
/**
 * @swagger
 * /orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (Vendor)
 *     tags:
 *       - Orders
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
 * /orders/{orderId}/pack:
 *   post:
 *     summary: Move order from PAID to ORDER_PACKED and alert riders (Vendor)
 *     tags:
 *       - Orders
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
 *         description: Order marked as packed and open for delivery dispatch
 */
router.post("/:orderId/pack", authMiddleware, OrderController.vendorPackOrder);

/**
 * @swagger
 * /orders/payment/initiate:
 *   post:
 *     summary: Initiate payment via Paystack (NGN) or PawaPay (RWF)
 *     tags:
 *       - Orders
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
 *     tags:
 *       - Orders
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
 *     tags:
 *       - Orders
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
 * /orders/{orderId}/undo-job:
 *   post:
 *     summary: Rider cancels their accepted job tracking assignment
 *     tags:
 *       - Orders
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
 *         description: Job unassigned and order placed back into pooling nodes
 */
router.post("/:orderId/undo-job", authMiddleware, OrderController.riderUndoJob);

/**
 * @swagger
 * /orders/{orderId}/verify-rider:
 *   post:
 *     summary: Vendor verifies rider verification key at pickup terminal point
 *     tags:
 *       - Orders
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
 *             required:
 *               - secretKey
 *             properties:
 *               secretKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rider key authenticated. Order progressed to en-route to customer terminal.
 */
router.post(
  "/:orderId/verify-rider",
  authMiddleware,
  OrderController.vendorVerifyRiderKey,
);

/**
 * @swagger
 * /orders/verify-customer:
 *   post:
 *     summary: Rider verifies customer security verification key to finalize trip execution node
 *     tags:
 *       - Orders
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
 *               - secretKey
 *             properties:
 *               orderId:
 *                 type: string
 *               secretKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Key authenticated. Status resolved to DELIVERED.
 */
router.post(
  "/verify-customer",
  authMiddleware,
  OrderController.riderVerifyCustomerKeyAndDeliver,
);

/**
 * @swagger
 * /orders/{orderId}/location:
 *   patch:
 *     summary: Broadcast live coordinate streams of ongoing transit paths
 *     tags:
 *       - Orders
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
 *             required:
 *               - locationData
 *             properties:
 *               locationData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Coordinate updates ingested successfully
 */
router.patch(
  "/:orderId/location",
  authMiddleware,
  OrderController.updateRiderLocation,
);

export default router;
