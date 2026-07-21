import { Request, Response } from "express";
import {
  getVendorAppUpdates,
  updateVendorAppUpdateByKey,
  UpdateVendorAppUpdateInput,
} from "../../services/admin/adminVendorAppUpdate.service";

export const handleGetVendorAppUpdates = async (
  req: Request,
  res: Response,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getVendorAppUpdates(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch vendor app update configurations",
    });
  }
};

export const handleUpdateVendorAppUpdate = async (
  req: Request,
  res: Response,
) => {
  try {
    const { key } = req.params;
    const updateData: UpdateVendorAppUpdateInput = req.body;

    const updatedConfig = await updateVendorAppUpdateByKey(key, updateData);

    return res.status(200).json({
      success: true,
      message: "Vendor app update settings updated successfully",
      data: updatedConfig,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to update vendor app update configurations",
    });
  }
};
