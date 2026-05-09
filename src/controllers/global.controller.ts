import { Request, Response } from "express";
import { GlobalService } from "../services/global.servvice";
import { logger } from "../utils/logger";

export class GlobalController {
  static async getCountries(req: Request, res: Response) {
    try {
      const countries = await GlobalService.getCountries();

      return res.status(200).json({
        success: true,
        data: countries,
      });
    } catch (error: any) {
      logger.error("Controller Error - getCountries:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch country list",
        error: error.message,
      });
    }
  }

  static async getCountryDetails(req: Request, res: Response) {
    try {
      const { iso } = req.params;
      const country = await GlobalService.getCountryByIso(iso);

      return res.status(200).json({
        success: true,
        data: country,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message || "Country not found",
      });
    }
  }
}
