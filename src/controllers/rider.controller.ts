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
