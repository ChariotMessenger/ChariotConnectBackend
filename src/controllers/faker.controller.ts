import { Request, Response } from "express";
import { DevSeederService } from "../services/faker.service";
import { logger } from "../utils/logger";

export class DevSeederController {
  static async seedCustomer(req: Request, res: Response) {
    try {
      // Security check to ensure this only runs in development
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          message: "Seeding is not allowed in production mode",
        });
      }

      const customer = await DevSeederService.createMockCustomer();

      res.status(201).json({
        success: true,
        message: "Mock customer created successfully",
        data: {
          id: customer.id,
          email: customer.email,
          password: "password123",
        },
      });
    } catch (error) {
      logger.error("Error in seedCustomer controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to seed customer",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async seedVendor(req: Request, res: Response) {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          message: "Seeding is not allowed in production mode",
        });
      }

      const vendor = await DevSeederService.createMockVendor();

      res.status(201).json({
        success: true,
        message: "Mock vendor created successfully",
        data: {
          id: vendor.id,
          email: vendor.email,
          businessName: vendor.businessName,
          password: "password123",
        },
      });
    } catch (error) {
      logger.error("Error in seedVendor controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to seed vendor",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async seedRider(req: Request, res: Response) {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          message: "Seeding is not allowed in production mode",
        });
      }

      const rider = await DevSeederService.createMockRider();

      res.status(201).json({
        success: true,
        message: "Mock rider created successfully",
        data: {
          id: rider.id,
          email: rider.email,
          plateNumber: rider.bikePlateNumber,
          password: "password123",
        },
      });
    } catch (error) {
      logger.error("Error in seedRider controller:", error);
      res.status(500).json({
        success: false,
        message: "Failed to seed rider",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
