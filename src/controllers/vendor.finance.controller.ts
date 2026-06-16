import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { VendorFinancialService } from "../services/vendor.finance.service";
import { PaymentStatus, WithdrawalStatus } from "@prisma/client";

export class VendorFinancialController {
  static async getTransactions(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const vendorId = req.user!.id;
      const status = req.query.status as PaymentStatus | undefined;

      const transactions = await VendorFinancialService.getTransactionHistory(
        vendorId,
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
      const vendorId = req.user!.id;
      const status = req.query.status as WithdrawalStatus | undefined;

      const withdrawals = await VendorFinancialService.getWithdrawalRequests(
        vendorId,
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
      const vendorId = req.user!.id;
      const { amount } = req.body;

      const parsedAmount = parseFloat(amount);
      const withdrawal = await VendorFinancialService.requestWithdrawal(
        vendorId,
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
      const vendorId = req.user!.id;
      const { newBankName, newAccountNumber, newAccountName, password } =
        req.body;

      const changeRequest =
        await VendorFinancialService.proposeBankDetailsChange(vendorId, {
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
