import { Request, Response } from "express";
import { getAppUpdatesByRole, TargetRole } from "../services/appUpdate.service";

export const handleGetAppUpdates = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getAppUpdatesByRole(role as TargetRole, page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch app update configurations",
    });
  }
};
