import { Router } from "express";
import {
  handleGetCustomerAppUpdates,
  handleUpdateCustomerAppUpdate,
} from "../../controllers/admin/admincustomerAppUpdate.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// /**
//  * @swagger
//  * /admin/app-update/customer:
//  *   get:
//  *     summary: Get Customer App Update Configurations with Pagination
//  *     tags:
//  *       - Admin App Update
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           default: 1
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 10
//  *     responses:
//  *       200:
//  *         description: Customer app update configurations retrieved successfully
//  */
router.get("/customer", authMiddleware, handleGetCustomerAppUpdates);

// /**
//  * @swagger
//  * /admin/app-update/customer/{key}:
//  *   put:
//  *     summary: Create or Update Customer App Update Configuration by Key
//  *     tags:
//  *       - Admin App Update
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: key
//  *         required: true
//  *         schema:
//  *           type: string
//  *         example: customers_app_update1
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               isUpdateAvailable:
//  *                 type: boolean
//  *               mustUpdate:
//  *                 type: boolean
//  *               androidAppLink:
//  *                 type: string
//  *               iosAppLink:
//  *                 type: string
//  *               isAndroid:
//  *                 type: boolean
//  *               isIos:
//  *                 type: boolean
//  *     responses:
//  *       200:
//  *         description: App update settings updated successfully
//  */
router.put("/customer/:key", authMiddleware, handleUpdateCustomerAppUpdate);

export const adminCustomerAppUpdateRouter = router;
