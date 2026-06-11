import { Router } from "express";
import {
  handleGetPricingConfiguration,
  handleUpdatePricingConfiguration,
} from "../../controllers/admin/admin.pricing.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// /**
//  * @swagger
//  * /admin/billing/pricing-config:
//  * get:
//  * summary: Get Global Pricing Configuration
//  * tags:
//  * - Admin Billing
//  * security:
//  * - bearerAuth: []
//  * responses:
//  * 200:
//  * description: Pricing configuration retrieved successfully
//  */
router.get("/pricing-config", authMiddleware, handleGetPricingConfiguration);

// /**
//  * @swagger
//  * /admin/billing/pricing-config:
//  * patch:
//  * summary: Update Global Pricing Configuration
//  * tags:
//  * - Admin Billing
//  * security:
//  * - bearerAuth: []
//  * requestBody:
//  * required: true
//  * content:
//  * application/json:
//  * schema:
//  * type: object
//  * properties:
//  * deliveryCut:
//  * type: number
//  * orderProtectionFee:
//  * type: number
//  * orderProcessingFee:
//  * type: number
//  * responses:
//  * 200:
//  * description: Pricing configuration updated successfully
//  */
router.patch(
  "/pricing-config",
  authMiddleware,
  handleUpdatePricingConfiguration,
);

export const adminPricingRouter = router;
