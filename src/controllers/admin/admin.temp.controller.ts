import { Request, Response } from "express";
import { AccountService } from "../../services/admin/admin.temp.service";
import { UserRole } from "@prisma/client";

const accountService = new AccountService();

export class AccountController {
  async deleteAccount(req: Request, res: Response) {
    try {
      const { userId, role } = req.body;

      if (!userId || !role) {
        return res.status(400).json({
          success: false,
          message: "User ID and Role are required",
        });
      }

      await accountService.deleteUserAccount(userId, role as UserRole);

      return res.status(200).json({
        success: true,
        message: "Account and associated data deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async verifyAndExit(req: Request, res: Response) {
    try {
      const { email, role } = req.query;

      const user = await accountService.findUserByEmail(
        email as string,
        role as UserRole,
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: { id: user.id },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
