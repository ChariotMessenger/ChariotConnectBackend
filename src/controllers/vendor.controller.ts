import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { vendorService } from "../services/vendor.service";
import { catalogService } from "../services/catalog.service";
import { orderService } from "../services/order.service";
import { messageService } from "../services/message.service";
import { reviewService } from "../services/review-favorite.service";
import UploadService from "../services/upload.service";
import { logger } from "../utils/logger";
import { CustomError } from "../middlewares/errorHandler";

export class VendorController {
  static async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const vendorId = req.user?.id;

      if (!vendorId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Vendor ID not found in request",
          code: "UNAUTHORIZED",
        });
      }

      const result = await vendorService.deleteAccount(vendorId);

      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in deleteAccount controller (Vendor):", error);

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

  static async registerStep1(req: AuthRequest, res: Response) {
    try {
      const result = await vendorService.registerStep1(req.body);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in registerStep1:", error);
      throw error;
    }
  }

  static async registerStep2(req: AuthRequest, res: Response) {
    try {
      const result = await vendorService.registerStep2(req.body);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in registerStep2:", error);
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

      const result = await vendorService.resendOTP(email);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in resendOTP controller:", error);
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

      const result = await vendorService.forgotPasswordStep1(email);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in vendor forgotPasswordStep1 controller:", error);
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

      const result = await vendorService.forgotPasswordStep2({
        email,
        otp,
        newPassword,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in vendor forgotPasswordStep2 controller:", error);
      throw error;
    }
  }

  static async registerStep3(req: AuthRequest, res: Response) {
    try {
      const result = await vendorService.registerStep3(req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error("Error in registerStep3:", error);
      throw error;
    }
  }

  static async loginWithOTP(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;
      const result = await vendorService.loginWithOTP(email);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in loginWithOTP:", error);
      throw error;
    }
  }

  static async verifyLoginOTP(req: AuthRequest, res: Response) {
    try {
      const { email, otp } = req.body;
      const result = await vendorService.verifyLoginOTP(email, otp);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in verifyLoginOTP:", error);
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

      const result = await vendorService.loginWithPassword({
        identifier,
        password,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in vendor loginWithPassword controller:", error);
      throw error;
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const vendor = await vendorService.getProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: vendor,
      });
    } catch (error) {
      logger.error("Error in getProfile:", error);
      throw error;
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const vendor = await vendorService.updateProfile(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: vendor,
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
        "VENDOR",
      );

      const vendor = await vendorService.updateProfilePhoto(
        req.user!.id,
        photoUrl,
      );

      res.status(200).json({
        success: true,
        message: "Profile photo updated",
        data: vendor,
      });
    } catch (error) {
      logger.error("Error in uploadProfilePhoto:", error);
      throw error;
    }
  }

  // Catalog operations
  static async createCatalogItem(req: AuthRequest, res: Response) {
    try {
      const item = await catalogService.createItem(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: "Catalog item created",
        data: item,
      });
    } catch (error) {
      logger.error("Error in createCatalogItem:", error);
      throw error;
    }
  }

  static async updateCatalogItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const item = await catalogService.updateItem(
        itemId,
        req.user!.id,
        req.body,
      );
      res.status(200).json({
        success: true,
        message: "Catalog item updated",
        data: item,
      });
    } catch (error) {
      logger.error("Error in updateCatalogItem:", error);
      throw error;
    }
  }

  static async deleteCatalogItem(req: AuthRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const result = await catalogService.deleteItem(itemId, req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in deleteCatalogItem:", error);
      throw error;
    }
  }

  static async getCatalog(req: AuthRequest, res: Response) {
    try {
      const items = await catalogService.getVendorCatalog(req.user!.id);
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      logger.error("Error in getCatalog:", error);
      throw error;
    }
  }

  // Order operations
  static async getOrders(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      const orders = await orderService.getVendorOrders(
        req.user!.id,
        status as any,
      );
      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      logger.error("Error in getOrders:", error);
      throw error;
    }
  }

  static async acceptOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await orderService.acceptOrder(orderId, req.user!.id);
      res.status(200).json({
        success: true,
        message: "Order accepted",
        data: order,
      });
    } catch (error) {
      logger.error("Error in acceptOrder:", error);
      throw error;
    }
  }

  static async rejectOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const order = await orderService.rejectOrder(
        orderId,
        req.user!.id,
        reason,
      );
      res.status(200).json({
        success: true,
        message: "Order rejected",
        data: order,
      });
    } catch (error) {
      logger.error("Error in rejectOrder:", error);
      throw error;
    }
  }

  static async completeOrder(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await orderService.completeOrder(orderId, req.user!.id);
      res.status(200).json({
        success: true,
        message: "Order completed",
        data: order,
      });
    } catch (error) {
      logger.error("Error in completeOrder:", error);
      throw error;
    }
  }

  // Messaging
  static async getMessages(req: AuthRequest, res: Response) {
    try {
      const conversations = await messageService.getUserConversations(
        req.user!.id,
        "VENDOR" as any,
      );

      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      logger.error("Error in getMessages:", error);
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

  // Reviews
  static async getVendorReviews(req: AuthRequest, res: Response) {
    try {
      const result = await reviewService.getVendorReviews(req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error in getVendorReviews:", error);
      throw error;
    }
  }
}

export const vendorController = VendorController;
