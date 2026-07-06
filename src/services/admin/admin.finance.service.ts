import {
  PrismaClient,
  WithdrawalStatus,
  VerificationStatus,
} from "@prisma/client";
import { emitWalletBalanceUpdate } from "../../config/socket";

const prisma = new PrismaClient();

export const adminFinanceService = {
  async getWithdrawalRequests(
    page: number,
    limit: number,
    status?: WithdrawalStatus,
  ) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              businessName: true,
            },
          },
          rider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async handleWithdrawalStatus(id: string, status: WithdrawalStatus) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new Error("Withdrawal request not found");
      }

      if (request.status !== WithdrawalStatus.PENDING) {
        throw new Error(
          `Request has already been processed with status: ${request.status}`,
        );
      }

      const updatedRequest = await tx.withdrawalRequest.update({
        where: { id },
        data: { status },
      });

      const ownerId = request.vendorId || request.riderId;
      if (!ownerId) throw new Error("Request has no associated account owner");

      const wallet = await tx.wallet.findFirst({
        where: request.vendorId
          ? { vendorId: request.vendorId }
          : { riderId: request.riderId },
      });

      if (!wallet) throw new Error("Associated escrow wallet not found");

      let updatedBalance = wallet.balance;

      if (status === WithdrawalStatus.APPROVED) {
        if (wallet.balance < request.amount) {
          throw new Error(
            "Insufficient wallet balance to approve this payout request",
          );
        }

        const finalWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: request.amount } },
        });

        updatedBalance = finalWallet.balance;

        const transactionData: any = {
          amount: request.amount,
          type: "WITHDRAWAL",
          status: "SUCCESSFUL",
          reference: request.reference,
          currency: request.currency,
        };

        if (request.vendorId) {
          transactionData.vendor = { connect: { id: request.vendorId } };
        } else if (request.riderId) {
          transactionData.rider = { connect: { id: request.riderId } };
        }

        await tx.walletTransaction.create({
          data: transactionData,
        });
      }

      const activePending = await tx.withdrawalRequest.aggregate({
        where: {
          vendorId: request.vendorId,
          riderId: request.riderId,
          status: WithdrawalStatus.PENDING,
        },
        _sum: { amount: true },
      });

      const totalPendingWithdrawal = activePending._sum.amount || 0;

      emitWalletBalanceUpdate(
        ownerId,
        updatedBalance,
        wallet.currency,
        totalPendingWithdrawal,
      );

      return updatedRequest;
    });
  },
  async getBankDetailsRequests(
    page: number,
    limit: number,
    status?: VerificationStatus,
  ) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.bankDetailsChangeRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              businessName: true,
            },
          },
          rider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bankDetailsChangeRequest.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async handleBankDetailsStatus(id: string, status: VerificationStatus) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.bankDetailsChangeRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new Error("Bank details alteration request not found");
      }

      if (request.status !== VerificationStatus.PENDING) {
        throw new Error(
          `Request has already been processed with status: ${request.status}`,
        );
      }

      const updatedRequest = await tx.bankDetailsChangeRequest.update({
        where: { id },
        data: { status },
      });

      if (status === VerificationStatus.VERIFIED) {
        if (request.vendorId) {
          await tx.vendor.update({
            where: { id: request.vendorId },
            data: {
              bankName: request.newBankName,
              accountNumber: request.newAccountNumber,
              accountName: request.newAccountName,
            },
          });
        } else if (request.riderId) {
          await tx.rider.update({
            where: { id: request.riderId },
            data: {
              bankName: request.newBankName,
              accountNumber: request.newAccountNumber,
              accountName: request.newAccountName,
            },
          });
        }
      }

      return updatedRequest;
    });
  },
};
