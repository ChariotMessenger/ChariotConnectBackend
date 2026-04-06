import { Request, Response } from "express";
import { AdminAuthService } from "../../services/admin/adminAuth.service";
import { AuthRequest } from "../../middlewares/auth";
const authService = new AdminAuthService();

export class AdminAuthController {
  static async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      return res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async updatePassword(req: AuthRequest, res: Response) {
    try {
      await authService.updatePassword(req.user!.id, req.body);
      return res
        .status(200)
        .json({ success: true, message: "Password updated" });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
