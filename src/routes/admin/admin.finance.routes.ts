import { Router } from "express";
import {
  handleGetWithdrawals,
  handleUpdateWithdrawalStatus,
  handleGetBankChanges,
  handleUpdateBankDetailsStatus,
} from "../../controllers/admin/admin.finance.controller";
import { authenticateAdmin } from "../../middlewares/adminAuth";

const router = Router();

router.use(authenticateAdmin);
router.get("/withdrawals", handleGetWithdrawals);
router.patch("/withdrawals/:id/status", handleUpdateWithdrawalStatus);

router.get("/bank-details-changes", handleGetBankChanges);
router.patch("/bank-details-changes/:id/status", handleUpdateBankDetailsStatus);

export const adminFinanceRouter = router;
