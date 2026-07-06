import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { adminVerificationService } from "../../services/admin/admin.verification.service";

export const handleGetPendingVerifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await adminVerificationService.getPendingVerifications(
      limit,
      offset,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending verifications queue",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
