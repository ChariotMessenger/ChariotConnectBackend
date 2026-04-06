import { Router } from "express";
import { AdminAuthController } from "../../controllers/admin/adminAuth.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     summary: Admin Login
 *     tags:
 *       - Admin Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", AdminAuthController.login);

/**
 * @swagger
 * /admin/auth/update-password:
 *   patch:
 *     summary: Update Admin Password
 *     tags:
 *       - Admin Auth
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/update-password",
  authMiddleware,
  AdminAuthController.updatePassword,
);

export default router;
