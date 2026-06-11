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

export class VendorFinancialService {
  static async getTransactionHistory(
    vendorId: string,
    filterStatus?: PaymentStatus,
  ) {
    try {
      return await prisma.walletTransaction.findMany({
        where: {
          vendorId,
          ...(filterStatus && { status: filterStatus }),
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error(
        `Error fetching transaction history for vendor ${vendorId}:`,
        error,
      );
      throw error;
    }
  }

  static async getWithdrawalRequests(
    vendorId: string,
    filterStatus?: WithdrawalStatus,
  ) {
    try {
      return await prisma.withdrawalRequest.findMany({
        where: {
          vendorId,
          ...(filterStatus && { status: filterStatus }),
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error(`Error fetching withdrawals for vendor ${vendorId}:`, error);
      throw error;
    }
  }

  static async requestWithdrawal(vendorId: string, amount: number) {
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
          where: { vendorId, status: VerificationStatus.PENDING },
        });

      if (pendingBankChanges) {
        throw new CustomError(
          "Cannot request withdrawal while bank details change verification is pending.",
          400,
          "PENDING_BANK_VERIFICATION",
        );
      }

      const wallet = await prisma.wallet.findUnique({ where: { vendorId } });
      if (!wallet || wallet.balance < amount) {
        throw new CustomError(
          "Insufficient wallet balance for withdrawal request",
          400,
          "INSUFFICIENT_FUNDS",
        );
      }

      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: {
          bankName: true,
          accountNumber: true,
          accountName: true,
          currency: true,
        },
      });

      if (!vendor || !vendor.accountNumber || !vendor.bankName) {
        throw new CustomError(
          "Vendor banking configuration profile is empty",
          400,
          "INCOMPLETE_BANK_PROFILE",
        );
      }

      const reference = `WDR-VND-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      return await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { vendorId },
          data: { balance: { decrement: amount } },
        });

        const request = await tx.withdrawalRequest.create({
          data: {
            vendorId,
            amount,
            currency: wallet.currency,
            bankName: vendor.bankName || "",
            accountNumber: vendor.accountNumber || "",
            accountName: vendor.accountName || "",
            status: WithdrawalStatus.PENDING,
            reference,
          },
        });

        await tx.walletTransaction.create({
          data: {
            vendorId,
            amount,
            type: WalletTransactionType.WITHDRAWAL,
            status: PaymentStatus.PENDING,
            reference,
            description: `Withdrawal request routed to account ${vendor.accountNumber}`,
          },
        });

        return request;
      });
    } catch (error) {
      logger.error(
        `Error executing withdrawal request for vendor ${vendorId}:`,
        error,
      );
      throw error;
    }
  }

  static async proposeBankDetailsChange(
    vendorId: string,
    data: {
      newBankName: string;
      newAccountNumber: string;
      newAccountName: string;
    },
  ) {
    try {
      const activePendingRequest =
        await prisma.bankDetailsChangeRequest.findFirst({
          where: { vendorId, status: VerificationStatus.PENDING },
        });

      if (activePendingRequest) {
        throw new CustomError(
          "You already have an outstanding profile verification update pending review.",
          400,
          "DUPLICATE_CHANGE_REQUEST",
        );
      }

      const currentVendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { bankName: true, accountNumber: true, accountName: true },
      });

      return await prisma.bankDetailsChangeRequest.create({
        data: {
          vendorId,
          oldBankName: currentVendor?.bankName,
          oldAccountNumber: currentVendor?.accountNumber,
          oldAccountName: currentVendor?.accountName,
          newBankName: data.newBankName,
          newAccountNumber: data.newAccountNumber,
          newAccountName: data.newAccountName,
          status: VerificationStatus.PENDING,
        },
      });
    } catch (error) {
      logger.error(
        `Error writing bank modification payload for vendor ${vendorId}:`,
        error,
      );
      throw error;
    }
  }
}
