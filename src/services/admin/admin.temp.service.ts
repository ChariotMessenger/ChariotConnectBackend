import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

export class AccountService {
  async deleteUserAccount(userId: string, role: UserRole) {
    switch (role) {
      case "CUSTOMER":
        return await prisma.customer.delete({
          where: { id: userId },
        });
      case "VENDOR":
        return await prisma.vendor.delete({
          where: { id: userId },
        });
      case "RIDER":
        return await prisma.rider.delete({
          where: { id: userId },
        });
      case "ADMIN":
        return await prisma.admin.delete({
          where: { id: userId },
        });
      default:
        throw new Error("Invalid user role");
    }
  }

  async findUserByEmail(email: string, role: UserRole) {
    switch (role) {
      case "CUSTOMER":
        return await prisma.customer.findUnique({ where: { email } });
      case "VENDOR":
        return await prisma.vendor.findUnique({ where: { email } });
      case "RIDER":
        return await prisma.rider.findUnique({ where: { email } });
      case "ADMIN":
        return await prisma.admin.findUnique({ where: { email } });
      default:
        return null;
    }
  }
}
