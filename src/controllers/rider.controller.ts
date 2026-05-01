import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { riderService } from "../services/rider.service";
import UploadService from "../services/upload.service";
import { logger } from "../utils/logger";
import { CustomError } from "../middlewares/errorHandler";

export class RiderController {
  static async register(req: AuthRequest, res: Response) {
    try {
      const result = await riderService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error("Error in register:", error);
      throw error;
    }
  }

  static async verifyEmail(req: AuthRequest, res: Response) {
    try {
      const { email, phoneNumber, otp } = req.body;

      if ((!email && !phoneNumber) || !otp) {
        return res.status(400).json({
          success: false,
          message: "Identifier (Email/Phone) and OTP are required",
          code: "MISSING_VERIFICATION_DATA",
        });
      }

      const result = await riderService.verifyAccount({
        email,
        phoneNumber,
        otp,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in rider verifyAccount controller:", error);
      if (error instanceof CustomError) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      }
      throw error;
    }
  }
  static async forgotPasswordStep1(req: AuthRequest, res: Response) {
    try {
      const { email, phoneNumber } = req.body;

      if (!email && !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Email or Phone Number is required!",
          code: "MISSING_IDENTIFIER",
        });
      }

      const result = await riderService.forgotPasswordStep1({
        email,
        phoneNumber,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in rider forgotPasswordStep1 controller:", error);
      if (error instanceof CustomError) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      }
      throw error;
    }
  }

  static async forgotPasswordStep2(req: AuthRequest, res: Response) {
    try {
      const { email, phoneNumber, otp, newPassword } = req.body;

      if ((!email && !phoneNumber) || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Identifier (Email/Phone), OTP, and new password are required",
          code: "MISSING_RESET_DATA",
        });
      }

      const result = await riderService.forgotPasswordStep2({
        email,
        phoneNumber,
        otp,
        newPassword,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in rider forgotPasswordStep2 controller:", error);
      if (error instanceof CustomError) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      }
      throw error;
    }
  }

  static async resendOTP(req: AuthRequest, res: Response) {
    try {
      const { email, phoneNumber } = req.body;

      if (!email && !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Email or Phone Number is required",
          code: "MISSING_IDENTIFIER",
        });
      }

      const result = await riderService.resendOTP({ email, phoneNumber });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in rider resendOTP controller:", error);
      if (error instanceof CustomError) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      }
      throw error;
    }
  }

  static async loginWithPassword(req: AuthRequest, res: Response) {
    try {
      const { identifier, password } = req.body;
      const result = await riderService.loginWithPassword({
        identifier,
        password,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in loginWithPassword:", error);
      if (error instanceof CustomError) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      }
      throw error;
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const riderId = req.user!.id;
      const result = await riderService.deleteAccount(riderId);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in deleteAccount:", error);
      if (error instanceof CustomError) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
          code: error.code,
        });
      }
      throw error;
    }
  }

  static async loginStep1(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;
      const result = await riderService.loginStep1(email);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in loginStep1:", error);
      throw error;
    }
  }

  static async loginStep2(req: AuthRequest, res: Response) {
    try {
      const { email, otp } = req.body;
      const result = await riderService.loginStep2(email, otp);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in loginStep2:", error);
      throw error;
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const rider = await riderService.getProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: rider,
      });
    } catch (error) {
      logger.error("Error in getProfile:", error);
      throw error;
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const rider = await riderService.updateProfile(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: rider,
      });
    } catch (error) {
      logger.error("Error in updateProfile:", error);
      throw error;
    }
  }

  static async uploadProfilePhoto(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        throw new CustomError("No file uploaded", 400, "NO_FILE");
      }

      const photoUrl = await UploadService.uploadProfilePhoto(
        req.file,
        req.user!.id,
        "RIDER",
      );

      const rider = await riderService.updateProfilePhoto(
        req.user!.id,
        photoUrl,
      );

      res.status(200).json({
        success: true,
        message: "Profile photo updated",
        data: rider,
      });
    } catch (error) {
      logger.error("Error in uploadProfilePhoto:", error);
      throw error;
    }
  }

  static async goOnline(req: AuthRequest, res: Response) {
    try {
      const rider = await riderService.goOnline(req.user!.id);
      res.status(200).json({
        success: true,
        message: "Rider is now online",
        data: rider,
      });
    } catch (error) {
      logger.error("Error in goOnline:", error);
      throw error;
    }
  }

  static async getNearbyJobs(req: AuthRequest, res: Response) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = req.query.radius
        ? parseFloat(req.query.radius as string)
        : 5;

      if (isNaN(lat) || isNaN(lng)) {
        throw new CustomError(
          "Valid latitude and longitude are required",
          400,
          "INVALID_LOCATION",
        );
      }

      const orders = await riderService.getNearbyAvailableOrders(
        lat,
        lng,
        radius,
      );

      res.status(200).json({
        success: true,
        count: (orders as any).length,
        orders,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async goOffline(req: AuthRequest, res: Response) {
    try {
      const rider = await riderService.goOffline(req.user!.id);
      res.status(200).json({
        success: true,
        message: "Rider is now offline",
        data: rider,
      });
    } catch (error) {
      logger.error("Error in goOffline:", error);
      throw error;
    }
  }

  static async getOnlineRiders(req: AuthRequest, res: Response) {
    try {
      const { state } = req.query;

      if (!state) {
        throw new CustomError("State parameter required", 400, "MISSING_STATE");
      }

      const riders = await riderService.getOnlineRiders(state as string);
      res.status(200).json({
        success: true,
        data: riders,
      });
    } catch (error) {
      logger.error("Error in getOnlineRiders:", error);
      throw error;
    }
  }
}

export const riderController = RiderController;
