import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { RiderFinancialService } from "../services/rider.finance.service";
import { PaymentStatus, WithdrawalStatus } from "@prisma/client";

export class RiderFinancialController {
  static async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { riderId } = req.params;
      if (!riderId) {
        res.status(400).json({
          success: false,
          message: "Rider identification context parameter is required",
        });
        return;
      }

      const walletData = await RiderFinancialService.getWalletBalance(riderId);

      res.status(200).json({
        success: true,
        message: "Wallet balance records parsed successfully",
        data: walletData,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message:
          error.message || "Internal server error fetching wallet balance",
        code: error.errorCode || "INTERNAL_SERVER_ERROR",
      });
    }
  }
  static async getTransactions(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const riderId = req.user!.id;
      const filterStatus = req.query.status as PaymentStatus | undefined;
      const page = req.query.page
        ? parseInt(req.query.page as string)
        : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

      const transactions = await RiderFinancialService.getTransactionHistory({
        riderId,
        filterStatus,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWithdrawals(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const riderId = req.user!.id;
      const filterStatus = req.query.status as WithdrawalStatus | undefined;
      const page = req.query.page
        ? parseInt(req.query.page as string)
        : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

      const withdrawals = await RiderFinancialService.getWithdrawalRequests({
        riderId,
        filterStatus,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: withdrawals,
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkPendingBankDetailsChange(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const riderId = req.user!.id;
      const hasPending =
        await RiderFinancialService.hasPendingBankDetailsChange(riderId);

      res.status(200).json({
        success: true,
        data: { hasPending },
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestWithdrawal(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const riderId = req.user!.id;
      const { amount } = req.body;

      const parsedAmount = parseFloat(amount);
      const withdrawal = await RiderFinancialService.requestWithdrawal(
        riderId,
        parsedAmount,
      );

      res.status(201).json({
        success: true,
        message: "Withdrawal request submitted successfully",
        data: withdrawal,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBankDetails(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const riderId = req.user!.id;
      const { newBankName, newAccountNumber, newAccountName, password } =
        req.body;

      const changeRequest =
        await RiderFinancialService.proposeBankDetailsChange(riderId, {
          newBankName,
          newAccountNumber,
          newAccountName,
          password,
        });

      res.status(201).json({
        success: true,
        message:
          "Bank details modification submitted for administrative review",
        data: changeRequest,
      });
    } catch (error) {
      next(error);
    }
  }
}
