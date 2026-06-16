import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { RiderFinancialService } from "../services/rider.finance.service";
import { PaymentStatus, WithdrawalStatus } from "@prisma/client";

export class RiderFinancialController {
  static async getTransactions(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const riderId = req.user!.id;
      const status = req.query.status as PaymentStatus | undefined;

      const transactions = await RiderFinancialService.getTransactionHistory(
        riderId,
        status,
      );

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
      const status = req.query.status as WithdrawalStatus | undefined;

      const withdrawals = await RiderFinancialService.getWithdrawalRequests(
        riderId,
        status,
      );

      res.status(200).json({
        success: true,
        data: withdrawals,
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
