import { Request, Response } from "express";
import {
  getRiderAppUpdates,
  updateRiderAppUpdateByKey,
  UpdateRiderAppUpdateInput,
} from "../../services/admin/adminRiderAppUpdate.service";

export const handleGetRiderAppUpdates = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getRiderAppUpdates(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch rider app update configurations",
    });
  }
};

export const handleUpdateRiderAppUpdate = async (
  req: Request,
  res: Response,
) => {
  try {
    const { key } = req.params;
    const updateData: UpdateRiderAppUpdateInput = req.body;

    const updatedConfig = await updateRiderAppUpdateByKey(key, updateData);

    return res.status(200).json({
      success: true,
      message: "Rider app update settings updated successfully",
      data: updatedConfig,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to update rider app update configurations",
    });
  }
};
