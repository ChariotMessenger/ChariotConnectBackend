import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { adminParcelService } from "../../services/admin/admin.parcel.service";
import { ParcelDeliveryStatus } from "@prisma/client";

export const handleGetParcelDeliveries = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as ParcelDeliveryStatus) || undefined;
    const search = (req.query.search as string) || undefined;

    const result = await adminParcelService.getParcelDeliveries(
      page,
      limit,
      status,
      search,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform parcel delivery listings",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetParcelDeliveryDetails = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await adminParcelService.getParcelDeliveryDetails(id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Failed to gather comprehensive parcel tracking profile specification",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
