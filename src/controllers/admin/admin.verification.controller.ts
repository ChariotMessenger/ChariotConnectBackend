import { Request, Response } from "express";
import { getVerificationRequests } from "../../services/admin/admin.verification.service";
export class VerificationController {
  async getRequests(req: Request, res: Response) {
    try {
      const type = req.query.type as "VENDOR" | "RIDER";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!type || !["VENDOR", "RIDER"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Valid type (VENDOR or RIDER) is required",
        });
      }

      const verificationData = await getVerificationRequests(type, page, limit);

      return res.status(200).json({
        success: true,
        ...verificationData,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch verification requests",
      });
    }
  }
}
