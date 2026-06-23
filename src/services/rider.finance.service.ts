import { prisma } from "../config/database";
import { CustomError } from "../middlewares/errorHandler";
import { logger } from "../utils/logger";
import {
  PaymentStatus,
  WalletTransactionType,
  WithdrawalStatus,
  VerificationStatus,
} from "@prisma/client";
import crypto from "crypto";
import { comparePassword } from "../utils/password";

export class RiderFinancialService {
  static async getWalletBalance(riderId: string) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { riderId },
        select: {
          balance: true,
          currency: true,
          updatedAt: true,
        },
      });

      if (!wallet) {
        throw new CustomError(
          "Wallet account record not found for this rider profile",
          404,
          "WALLET_NOT_FOUND",
        );
      }

      return wallet;
    } catch (error) {
      logger.error(
        `Error retrieving wallet balance for rider ${riderId}:`,
        error,
      );
      throw error;
    }
  }
  static async getTransactionHistory(
    riderId: string,
    filterStatus?: PaymentStatus,
  ) {
    try {
      return await prisma.walletTransaction.findMany({
        where: {
          riderId,
          ...(filterStatus && { status: filterStatus }),
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error(
        `Error fetching transaction history for rider ${riderId}:`,
        error,
      );
      throw error;
    }
  }
  static async hasPendingBankDetailsChange(riderId: string): Promise<boolean> {
    try {
      const pendingRequest = await prisma.bankDetailsChangeRequest.findFirst({
        where: {
          riderId,
          status: VerificationStatus.PENDING,
        },
        select: {
          id: true,
        },
      });

      return pendingRequest !== null;
    } catch (error) {
      logger.error(
        `Error checking pending bank details change request for rider ${riderId}:`,
        error,
      );
      throw error;
    }
  }
  static async getWithdrawalRequests(
    riderId: string,
    filterStatus?: WithdrawalStatus,
  ) {
    try {
      return await prisma.withdrawalRequest.findMany({
        where: {
          riderId,
          ...(filterStatus && { status: filterStatus }),
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error(`Error fetching withdrawals for rider ${riderId}:`, error);
      throw error;
    }
  }

  static async requestWithdrawal(riderId: string, amount: number) {
    try {
      if (amount <= 0) {
        throw new CustomError(
          "Withdrawal amount must be greater than zero",
          400,
          "INVALID_AMOUNT",
        );
      }

      const pendingBankChanges =
        await prisma.bankDetailsChangeRequest.findFirst({
          where: { riderId, status: VerificationStatus.PENDING },
        });

      if (pendingBankChanges) {
        throw new CustomError(
          "Cannot request withdrawal while bank details change verification is pending.",
          400,
          "PENDING_BANK_VERIFICATION",
        );
      }

      const wallet = await prisma.wallet.findUnique({ where: { riderId } });
      if (!wallet || wallet.balance < amount) {
        throw new CustomError(
          "Insufficient wallet balance for withdrawal request",
          400,
          "INSUFFICIENT_FUNDS",
        );
      }

      const rider = await prisma.rider.findUnique({
        where: { id: riderId },
        select: {
          bankName: true,
          accountNumber: true,
          accountName: true,
          currency: true,
        },
      });

      if (!rider || !rider.accountNumber || !rider.bankName) {
        throw new CustomError(
          "Rider bank details profiles are incomplete",
          400,
          "INCOMPLETE_BANK_PROFILE",
        );
      }

      const reference = `WDR-RDR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      return await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { riderId },
          data: { balance: { decrement: amount } },
        });

        const request = await tx.withdrawalRequest.create({
          data: {
            riderId,
            amount,
            currency: wallet.currency,
            bankName: rider.bankName,
            accountNumber: rider.accountNumber,
            accountName: rider.accountName || "",
            status: WithdrawalStatus.PENDING,
            reference,
          },
        });

        await tx.walletTransaction.create({
          data: {
            riderId,
            amount,
            type: WalletTransactionType.WITHDRAWAL,
            status: PaymentStatus.PENDING,
            reference,
            description: `Withdrawal request routed to bank account ${rider.accountNumber}`,
          },
        });

        return request;
      });
    } catch (error) {
      logger.error(
        `Error executing withdrawal request for rider ${riderId}:`,
        error,
      );
      throw error;
    }
  }

  static async proposeBankDetailsChange(
    riderId: string,
    data: {
      newBankName: string;
      newAccountNumber: string;
      newAccountName: string;
      password?: string;
    },
  ) {
    try {
      if (!data.password) {
        throw new CustomError(
          "Password verification is required to update bank details.",
          400,
          "PASSWORD_REQUIRED",
        );
      }

      const activePendingRequest =
        await prisma.bankDetailsChangeRequest.findFirst({
          where: { riderId, status: VerificationStatus.PENDING },
        });

      if (activePendingRequest) {
        throw new CustomError(
          "You already have an outstanding profile verification update pending review.",
          400,
          "DUPLICATE_CHANGE_REQUEST",
        );
      }

      const currentRider = await prisma.rider.findUnique({
        where: { id: riderId },
        select: {
          bankName: true,
          accountNumber: true,
          accountName: true,
          password: true,
        },
      });

      if (!currentRider) {
        throw new CustomError(
          "Rider profile not found.",
          404,
          "RIDER_NOT_FOUND",
        );
      }

      const isPasswordValid = await comparePassword(
        data.password,
        currentRider.password,
      );

      if (!isPasswordValid) {
        throw new CustomError(
          "Invalid password configuration credentials provided.",
          401,
          "INVALID_PASSWORD",
        );
      }

      return await prisma.bankDetailsChangeRequest.create({
        data: {
          riderId,
          oldBankName: currentRider.bankName,
          oldAccountNumber: currentRider.accountNumber,
          oldAccountName: currentRider.accountName,
          newBankName: data.newBankName,
          newAccountNumber: data.newAccountNumber,
          newAccountName: data.newAccountName,
          status: VerificationStatus.PENDING,
        },
      });
    } catch (error) {
      logger.error(
        `Error writing bank modification payload for rider ${riderId}:`,
        error,
      );
      throw error;
    }
  }
}
