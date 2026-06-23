import { Router } from "express";
import { RiderFinancialController } from "../controllers/rider.finance.controller";
import { VendorFinancialController } from "../controllers/vendor.finance.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
/**
 * @swagger
 * /finance/rider/transactions:
 *   get:
 *     summary: Get Rider Transaction History
 *     description: Retrieve all balance mutations, inflows, and outflows for the authenticated rider.
 *     tags:
 *       - Rider Financials
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED]
 *         required: false
 *         description: Filter transactions by payment execution state.
 *     responses:
 *       200:
 *         description: Transaction dataset processed successfully.
 *       401:
 *         description: Unauthorized access token missing or malformed.
 */
router.get(
  "/rider/transactions",
  authMiddleware,
  RiderFinancialController.getTransactions,
);

/**
 * @swagger
 * /finance/rider/withdrawals:
 *   get:
 *     summary: Get Rider Withdrawal Requests
 *     description: Fetch historically initiated settlement payouts and their administrative statuses.
 *     tags:
 *       - Rider Financials
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         required: false
 *         description: Filter payouts by approval status.
 *     responses:
 *       200:
 *         description: List of withdrawal records retrieved.
 */
router.get(
  "/rider/withdrawals",
  authMiddleware,
  RiderFinancialController.getWithdrawals,
);

/**
 * @swagger
 * /finance/rider/withdraw:
 *   post:
 *     summary: Request Wallet Withdrawal
 *     description: Decrements the rider balance immediately and logs a pending bank payout transaction. Blocked if a bank profile modification is pending administrative review.
 *     tags:
 *       - Rider Financials
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000.0
 *     responses:
 *       201:
 *         description: Payout initialized and locked successfully.
 *       400:
 *         description: Insufficient ledger funds or pending bank profile update block.
 */
router.post(
  "/rider/withdraw",
  authMiddleware,
  RiderFinancialController.requestWithdrawal,
);
/**
 * @swagger
 * /finance/rider/bank-details:
 *   post:
 *     summary: Propose Bank Details Mutation
 *     description: Creates a settlement modification payload requiring administrative verification before becoming active.
 *     tags:
 *       - Rider Financials
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newBankName
 *               - newAccountNumber
 *               - newAccountName
 *               - password
 *             properties:
 *               newBankName:
 *                 type: string
 *                 example: Access Bank
 *               newAccountNumber:
 *                 type: string
 *                 example: "0123456789"
 *               newAccountName:
 *                 type: string
 *                 example: Chukwuma Samuel
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecureP@ss123"
 *     responses:
 *       201:
 *         description: Profile variation queued for review.
 *       400:
 *         description: Duplicate pending variation request already active or password missing.
 *       401:
 *         description: Invalid password configuration credentials provided.
 */
router.post(
  "/rider/bank-details",
  authMiddleware,
  RiderFinancialController.updateBankDetails,
);

/**
 * @swagger
 * /finance/vendor/transactions:
 *   get:
 *     summary: Get Vendor Transaction History
 *     description: Retrieve all marketplace settlement transactions, order inflows, and platform deductions.
 *     tags:
 *       - Vendor Financials
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED]
 *         required: false
 *     responses:
 *       200:
 *         description: Transaction list managed successfully.
 */
router.get(
  "/vendor/transactions",
  authMiddleware,

  VendorFinancialController.getTransactions,
);

/**
 * @swagger
 * /finance/vendor/withdrawals:
 *   get:
 *     summary: Get Vendor Withdrawal Requests
 *     description: Retrieve historical bank withdrawal payouts initiated by the merchant vendor.
 *     tags:
 *       - Vendor Financials
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         required: false
 *     responses:
 *       200:
 *         description: Withdrawal collection parsed.
 */
router.get(
  "/vendor/withdrawals",
  authMiddleware,

  VendorFinancialController.getWithdrawals,
);
/**
 * @swagger
 * /finance/vendor/bank-change/pending:
 *   get:
 *     summary: Check Pending Bank Details Change
 *     description: Verify whether the merchant vendor currently has an active pending bank profile modification request.
 *     tags:
 *       - Vendor Financials
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending status evaluated.
 */
router.get(
  "/vendor/bank-change/pending",
  authMiddleware,
  VendorFinancialController.checkPendingBankDetailsChange,
);

/**
 * @swagger
 * /finance/rider/bank-change/pending:
 *   get:
 *     summary: Check Pending Bank Details Change
 *     description: Verify whether the rider currently has an active pending bank profile modification request.
 *     tags:
 *       - Rider Financials
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending status evaluated.
 */
router.get(
  "/rider/bank-change/pending",
  authMiddleware,
  RiderFinancialController.checkPendingBankDetailsChange,
);
/**
 * @swagger
 * /finance/vendor/withdraw:
 *   post:
 *     summary: Request Merchant Balance Withdrawal
 *     description: Triggers a balance decrement cycle within an atomized database state block to prepare payout parameters.
 *     tags:
 *       - Vendor Financials
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 25000.0
 *     responses:
 *       201:
 *         description: Merchant payout registered.
 *       400:
 *         description: Ledger validation failure or missing vendor information.
 */
router.post(
  "/vendor/withdraw",
  authMiddleware,
  VendorFinancialController.requestWithdrawal,
);
/**
 * @swagger
 * /finance/vendor/bank-details:
 *   post:
 *     summary: Queue Merchant Bank Modifications
 *     description: Files a bank detail modification request that requires administrative oversight before settling any subsequent payouts.
 *     tags:
 *       - Vendor Financials
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newBankName
 *               - newAccountNumber
 *               - newAccountName
 *               - password
 *             properties:
 *               newBankName:
 *                 type: string
 *                 example: Zenith Bank
 *               newAccountNumber:
 *                 type: string
 *                 example: "2048573921"
 *               newAccountName:
 *                 type: string
 *                 example: Dootling Global Enterprise
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecureP@ss123"
 *     responses:
 *       201:
 *         description: Verification log entered into system queues.
 *       400:
 *         description: Duplicate pending variation request already active or password missing.
 *       401:
 *         description: Invalid password configuration credentials provided.
 */
router.post(
  "/vendor/bank-details",
  authMiddleware,
  VendorFinancialController.updateBankDetails,
);

export const financeRouter = router;
