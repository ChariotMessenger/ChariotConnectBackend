import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { adminFinanceService } from "../../services/admin/admin.finance.service";
import { WithdrawalStatus, VerificationStatus } from "@prisma/client";

export const handleGetWithdrawals = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as WithdrawalStatus) || undefined;

    const result = await adminFinanceService.getWithdrawalRequests(
      page,
      limit,
      status,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to gather platform withdrawal metrics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateWithdrawalStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(WithdrawalStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid action status payload assigned",
      });
      return;
    }

    const result = await adminFinanceService.handleWithdrawalStatus(id, status);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Processing operational flow mutation broke down",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetBankChanges = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as VerificationStatus) || undefined;

    const result = await adminFinanceService.getBankDetailsRequests(
      page,
      limit,
      status,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assemble structured verification profile queues",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateBankDetailsStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(VerificationStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid payload modification request state",
      });
      return;
    }

    const result = await adminFinanceService.handleBankDetailsStatus(
      id,
      status,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Failed executing core model updates directly inside internal collection scope",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
