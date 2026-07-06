import { Router } from "express";
import { handleGetPendingVerifications } from "../../controllers/admin/admin.verification.controller";
import { authenticateAdmin } from "../../middlewares/adminAuth";

const router = Router();

/**
 * @swagger
 * /admin/verifications/pending:
 *   get:
 *     summary: Fetch Cross-Tenant Pending Verifications Queue
 *     description: Merges pending rows from both riders and vendors into a single chronological view stream.
 *     tags:
 *       - Admin Verifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         required: false
 *     responses:
 *       200:
 *         description: Aggregated queue matrix payload compiled successfully.
 *       401:
 *         description: Unauthorized access token.
 *       403:
 *         description: Forbidden administrative visibility requirement.
 *       500:
 *         description: Internal engine data fault.
 */
router.get("/pending", authenticateAdmin, handleGetPendingVerifications);

export const adminVerificationRouter = router;
