import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { customerService } from "../services/customer.service";
import {
  favoriteService,
  reviewService,
} from "../services/review-favorite.service";
import { vendorService } from "../services/vendor.service";
import { messageService } from "../services/message.service";
import UploadService from "../services/upload.service";
import { logger } from "../utils/logger";
import { CustomError } from "../middlewares/errorHandler";
import { OrderStatus } from "@prisma/client";

export class CustomerController {
  static async registerStep1(req: AuthRequest, res: Response) {
    try {
      const {
        email,
        firstName,
        lastName,
        phone,
        password,
        birthday,
        gender,
        country,
        receiveMarketingEmails,
      } = req.body;

      if (!email || !password || !firstName || !phone) {
        return res.status(400).json({
          success: false,
          message: "Email, password, first name, and phone are required",
          code: "MISSING_FIELDS",
        });
      }

      const result = await customerService.registerStep1({
        email,
        firstName,
        lastName,
        phone,
        password,
        birthday,
        gender,
        country,
        receiveMarketingEmails,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in registerStep1 controller:", error);
      throw error;
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User ID not found in request",
          code: "UNAUTHORIZED",
        });
      }

      const result = await customerService.deleteAccount(customerId);

      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in deleteAccount controller:", error);
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
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
          code: "MISSING_EMAIL",
        });
      }

      const result = await customerService.resendOTP(email);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in resendOTP controller:", error);
      throw error;
    }
  }

  static async registerStep2(req: AuthRequest, res: Response) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: "Email and OTP are required",
          code: "MISSING_VERIFICATION_DATA",
        });
      }

      const result = await customerService.registerStep2(req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error("Error in registerStep2 controller:", error);
      throw error;
    }
  }

  static async loginWithPassword(req: AuthRequest, res: Response) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: "Email/Phone and password are required",
          code: "MISSING_CREDENTIALS",
        });
      }

      const result = await customerService.loginWithPassword({
        identifier,
        password,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in loginWithPassword controller:", error);
      throw error;
    }
  }
  static async loginStep1(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;
      const result = await customerService.loginStep1(email);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in loginStep1:", error);
      throw error;
    }
  }

  static async loginStep2(req: AuthRequest, res: Response) {
    try {
      const { email, otp } = req.body;
      const result = await customerService.loginStep2(email, otp);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in loginStep2:", error);
      throw error;
    }
  }

  static async forgotPasswordStep1(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
          code: "MISSING_EMAIL",
        });
      }

      const result = await customerService.forgotPasswordStep1(email);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in forgotPasswordStep1 controller:", error);
      throw error;
    }
  }

  static async forgotPasswordStep2(req: AuthRequest, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Email, OTP, and new password are required",
          code: "MISSING_RESET_DATA",
        });
      }

      const result = await customerService.forgotPasswordStep2({
        email,
        otp,
        newPassword,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in forgotPasswordStep2 controller:", error);
      throw error;
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const customer = await customerService.getProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      logger.error("Error in getProfile:", error);
      throw error;
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const customer = await customerService.updateProfile(
        req.user!.id,
        req.body,
      );
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: customer,
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
        "CUSTOMER",
      );

      const customer = await customerService.updateProfilePhoto(
        req.user!.id,
        photoUrl,
      );

      res.status(200).json({
        success: true,
        message: "Profile photo updated",
        data: customer,
      });
    } catch (error) {
      logger.error("Error in uploadProfilePhoto:", error);
      throw error;
    }
  }

  static async fetchVendors(req: AuthRequest, res: Response) {
    try {
      const { latitude, longitude, radiusKm, vendorServiceType, page, limit } =
        req.body;

      if (!latitude && !longitude && !vendorServiceType) {
        throw new CustomError(
          "Either location or service type must be provided",
          400,
          "FILTER_REQUIRED",
        );
      }

      const result = await vendorService.getVendors({
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        radiusKm: radiusKm ? parseFloat(radiusKm) : 10,
        serviceType: vendorServiceType,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      logger.error("Error in fetchVendors:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode || "INTERNAL_ERROR",
      });
    }
  }
  static async getOrders(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as OrderStatus;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await customerService.getCustomerOrders(
        req.user!.id,
        status,
        page,
        limit,
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async addFavorite(req: AuthRequest, res: Response) {
    try {
      const { vendorId } = req.body;
      await favoriteService.addFavorite(req.user!.id, vendorId);

      res.status(200).json({
        success: true,
        message: "Added to favorites",
      });
    } catch (error) {
      logger.error("Error in addFavorite:", error);
      throw error;
    }
  }

  static async removeFavorite(req: AuthRequest, res: Response) {
    try {
      const { vendorId } = req.body;
      await favoriteService.removeFavorite(req.user!.id, vendorId);

      res.status(200).json({
        success: true,
        message: "Removed from favorites",
      });
    } catch (error) {
      logger.error("Error in removeFavorite:", error);
      throw error;
    }
  }

  static async getFavorites(req: AuthRequest, res: Response) {
    try {
      const favorites = await favoriteService.getCustomerFavorites(
        req.user!.id,
      );

      res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (error) {
      logger.error("Error in getFavorites:", error);
      throw error;
    }
  }

  static async createReview(req: AuthRequest, res: Response) {
    try {
      const review = await reviewService.createReview({
        vendorId: req.body.vendorId,
        customerId: req.user!.id,
        rating: req.body.rating,
        comment: req.body.comment,
      });

      res.status(201).json({
        success: true,
        message: "Review submitted",
        data: review,
      });
    } catch (error) {
      logger.error("Error in createReview:", error);
      throw error;
    }
  }

  static async messageVendor(req: AuthRequest, res: Response) {
    try {
      const { vendorId } = req.body;
      const room = await messageService.getOrCreateRoom(req.user!.id, vendorId);

      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error) {
      logger.error("Error in messageVendor:", error);
      throw error;
    }
  }

  static async getConversations(req: AuthRequest, res: Response) {
    try {
      const conversations = await messageService.getUserConversations(
        req.user!.id,
        "CUSTOMER" as any,
      );

      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      logger.error("Error in getConversations:", error);
      throw error;
    }
  }

  static async getRoomMessages(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await messageService.getRoomMessages(
        roomId,
        parseInt(limit as string),
        parseInt(offset as string),
      );

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      logger.error("Error in getRoomMessages:", error);
      throw error;
    }
  }
}

export const customerController = CustomerController;
