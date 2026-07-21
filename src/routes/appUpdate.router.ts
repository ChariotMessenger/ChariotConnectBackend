import { Router } from "express";
import { handleGetAppUpdates } from "../controllers/appUpdate.controller";

const router = Router();

/**
 * @swagger
 * /app-update/{role}:
 *   get:
 *     summary: Get App Update Configurations by Role
 *     tags:
 *       - App Update
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [customer, rider, vendor]
 *         example: customer
 *       - in: query
 *         name: key
 *         required: false
 *         schema:
 *           type: string
 *         example: customers_app_update1
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
 *         description: App update configurations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "669fc830a12b3c4d5e6f7a8b"
 *                       key:
 *                         type: string
 *                         example: "customers_app_update1"
 *                       isUpdateAvailable:
 *                         type: boolean
 *                         example: true
 *                       mustUpdate:
 *                         type: boolean
 *                         example: true
 *                       androidAppLink:
 *                         type: string
 *                         example: "https://play.google.com/store/apps/details?id=com.chariotconnect"
 *                       iosAppLink:
 *                         type: string
 *                         example: "https://apps.apple.com/app/id0000000002"
 *                       isAndroid:
 *                         type: boolean
 *                         example: true
 *                       isIos:
 *                         type: boolean
 *                         example: true
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-07-21T20:23:14.000Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 2
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 */
router.get("/:role", handleGetAppUpdates);

export const AppUpdateRouter = router;
