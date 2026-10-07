import { Request, Response } from "express";
import {
  getCustomerAppUpdates,
  updateCustomerAppUpdateByKey,
  UpdateCustomerAppUpdateInput,
} from "../../services/admin/admincustomerAppUpdate.service";

export const handleGetCustomerAppUpdates = async (
  req: Request,
  res: Response,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getCustomerAppUpdates(page, limit);

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

export const handleUpdateCustomerAppUpdate = async (
  req: Request,
  res: Response,
) => {
  try {
    const { key } = req.params;
    const updateData: UpdateCustomerAppUpdateInput = req.body;

    const updatedConfig = await updateCustomerAppUpdateByKey(key, updateData);

    return res.status(200).json({
      success: true,
      message: "App update settings updated successfully",
      data: updatedConfig,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update app update configurations",
    });
  }
};
