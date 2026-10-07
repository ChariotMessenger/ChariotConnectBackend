import { Request, Response } from "express";
import {
  getPricingConfiguration,
  updatePricingConfiguration,
} from "../../services/admin/admin.pricing.service";

export const handleGetPricingConfiguration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const config = await getPricingConfiguration();
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing configuration",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdatePricingConfiguration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { deliveryCut, orderProtectionFee, orderProcessingFee } = req.body;

    const updatedConfig = await updatePricingConfiguration({
      deliveryCut,
      orderProtectionFee,
      orderProcessingFee,
    });

    res.status(200).json({
      success: true,
      data: updatedConfig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update pricing configuration",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
