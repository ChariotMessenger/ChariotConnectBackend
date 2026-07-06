import { Router } from "express";
import {
  handleGetWithdrawals,
  handleUpdateWithdrawalStatus,
  handleGetBankChanges,
  handleUpdateBankDetailsStatus,
} from "../../controllers/admin/admin.finance.controller";
import { authMiddleware, authorize } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.use(authorize("MANAGE_FINANCES"));

router.get("/withdrawals", handleGetWithdrawals);
router.patch("/withdrawals/:id/status", handleUpdateWithdrawalStatus);

router.get("/bank-details-changes", handleGetBankChanges);
router.patch("/bank-details-changes/:id/status", handleUpdateBankDetailsStatus);

export const adminFinanceRouter = router;
