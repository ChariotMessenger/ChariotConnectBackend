import { Router } from "express";
import { subscribe } from "../controllers/newsletter.controller";

const router = Router();

/**
 * @swagger
 * /newsletter:
 *   post:
 *     summary: Subscribe to Newsletter
 *     description: Registers a new email address for the newsletter.
 *     tags:
 *       - Newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       201:
 *         description: Subscribed successfully.
 *       400:
 *         description: Email is required.
 *       409:
 *         description: Email is already subscribed.
 *       500:
 *         description: Internal server error.
 */
router.post("/", subscribe);

export const newsletterRoutes = router;
