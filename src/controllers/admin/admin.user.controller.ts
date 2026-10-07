import { Request, Response, NextFunction } from "express";
import { AdminUserManagementService } from "../../services/admin/admin.user.service";
import { VerificationStatus, OnlineStatus } from "@prisma/client";
import logger from "../../utils/logger";

const adminUserService = new AdminUserManagementService();

export class AdminUserController {
  static async getVendors(req: Request, res: Response, next: NextFunction) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        status: req.query.status as VerificationStatus,
      };

      const result = await adminUserService.getAllVendors(query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getRiders(req: Request, res: Response, next: NextFunction) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        status: req.query.status as VerificationStatus,
        onlineStatus: req.query.onlineStatus as OnlineStatus,
      };

      const result = await adminUserService.getAllRiders(query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
      };

      const result = await adminUserService.getAllCustomers(query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, id } = req.params;
      const details = await adminUserService.getAccountDetails(
        type as "vendor" | "rider" | "customer",
        id,
      );

      if (!details) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.status(200).json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  }

  static async handleUserVerification(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { type, id } = req.params;
      const { action } = req.body; // VERIFY | REJECT

      const updatedUser = await adminUserService.verifyUser(
        type as "vendor" | "rider",
        id,
        action,
      );

      res.status(200).json({
        success: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} ${action.toLowerCase()}ed successfully`,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle user operational status (Active vs Suspended)
   * Uses the 'status' field added to schema
   */
  static async toggleUserStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { type, id } = req.params;
      const { status } = req.body; // ACTIVE | SUSPENDED

      const prismaDelegate = (adminUserService as any).prisma[type];
      const updated = await prismaDelegate.update({
        where: { id },
        data: { status },
      });

      res.status(200).json({
        success: true,
        message: `User status updated to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
