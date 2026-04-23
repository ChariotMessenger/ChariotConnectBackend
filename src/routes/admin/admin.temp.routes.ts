import { Router, Request, Response, NextFunction } from "express";
import { AccountController } from "../../controllers/admin/admin.temp.controller";
const router = Router();
const accountController = new AccountController();
/**
 * @swagger
 * /admin/accounts/delete:
 *   delete:
 *     summary: Delete User Account
 *     description: Permanently delete a user account and all associated data (Cascade)
 *     tags:
 *       - Account Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "65f123abc456"
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, VENDOR, RIDER, ADMIN]
 *     responses:
 *       200:
 *         description: Account and associated data deleted successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/delete",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await accountController.deleteAccount(req, res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @swagger
 * /admin/accounts/verify-existence:
 *   get:
 *     summary: Verify User Existence
 *     description: Check if a user exists by email and role before proceeding with account actions
 *     tags:
 *       - Account Management
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CUSTOMER, VENDOR, RIDER, ADMIN]
 *     responses:
 *       200:
 *         description: User found
 *       444:
 *         description: User not found
 */
router.get(
  "/verify-existence",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await accountController.verifyAndExit(req, res);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
