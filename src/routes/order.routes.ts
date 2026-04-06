import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
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
 *               - items
 *               - totalAmount
 *             properties:
 *               vendorId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               totalAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, OrderController.createOrder);

/**
 * @swagger
 * /orders/payment/callback:
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
 *         description: Paystack transaction reference
 *     responses:
 *       200:
 *         description: Payment verification result
 */
router.get("/payment/callback", OrderController.verifyPayment);

export default router;
