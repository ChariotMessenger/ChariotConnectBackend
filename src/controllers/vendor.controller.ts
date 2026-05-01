import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { vendorService } from "../services/vendor.service";
import { catalogService } from "../services/catalog.service";
import { OrderStatus } from "@prisma/client";
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
      const { email, phoneNumber } = req.body;

      if (!email && !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Email or Phone Number is required",
          code: "MISSING_IDENTIFIER",
        });
      }

      const result = await vendorService.resendOTP({ email, phoneNumber });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in resendOTP controller:", error);
      throw error;
    }
  }

  static async forgotPasswordStep1(req: AuthRequest, res: Response) {
    try {
      const { email, phoneNumber } = req.body;

      if (!email && !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Email or Phone Number is required",
          code: "MISSING_IDENTIFIER",
        });
      }

      const result = await vendorService.forgotPasswordStep1({
        email,
        phoneNumber,
      });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in vendor forgotPasswordStep1 controller:", error);
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

      const result = await vendorService.forgotPasswordStep2({
        email,
        phoneNumber,
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

  static async uploadBrandLogo(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        throw new CustomError("No logo file uploaded", 400, "NO_FILE");
      }

      const logoUrl = await UploadService.uploadProfilePhoto(
        req.file,
        req.user!.id,
        "VENDOR",
      );

      const vendor = await vendorService.updateBrandLogo(req.user!.id, logoUrl);

      res.status(200).json({
        success: true,
        message: "Brand logo updated successfully",
        data: {
          brandLogoUrl: vendor.brandLogoUrl,
        },
      });
    } catch (error: any) {
      logger.error("Error in VendorController.uploadBrandLogo:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async uploadCoverPhoto(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        throw new CustomError("No cover photo file uploaded", 400, "NO_FILE");
      }

      const photoUrl = await UploadService.uploadProfilePhoto(
        req.file,
        req.user!.id,
        "VENDOR",
      );

      const vendor = await vendorService.updateCoverPhoto(
        req.user!.id,
        photoUrl,
      );

      res.status(200).json({
        success: true,
        message: "Cover photo updated successfully",
        data: {
          coverPhotoUrl: vendor.coverPhotoUrl,
        },
      });
    } catch (error: any) {
      logger.error("Error in VendorController.uploadCoverPhoto:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Catalog operations
  static async createCatalogItem(req: AuthRequest, res: Response) {
    try {
      const vendorId = req.user!.id;

      const item = await catalogService.createItem(vendorId, req.body);

      if (req.file) {
        try {
          const imageUrl = await UploadService.uploadCatalogImage(
            req.file,
            vendorId,
            item.id,
          );

          await catalogService.updateItem(item.id, vendorId, { imageUrl });
          item.imageUrl = imageUrl;
        } catch (uploadError) {
          logger.error(
            "Image upload failed, but item was created:",
            uploadError,
          );
        }
      }

      res.status(201).json({
        success: true,
        message: "Catalog item created successfully",
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
      const vendorId = req.user!.id;

      let updateData = { ...req.body };

      if (req.file) {
        const imageUrl = await UploadService.uploadCatalogImage(
          req.file,
          vendorId,
          itemId,
        );
        updateData.imageUrl = imageUrl;
      }

      const item = await catalogService.updateItem(
        itemId,
        vendorId,
        updateData,
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await catalogService.getVendorCatalog(
        req.user!.id,
        page,
        limit,
      );
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error("Error in getCatalog:", error);
      throw error;
    }
  }

  static async createCategory(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const category = await catalogService.createCategory(req.user!.id, name);
      res.status(201).json({
        success: true,
        message: "Category created",
        data: category,
      });
    } catch (error) {
      logger.error("Error in createCategory:", error);
      throw error;
    }
  }

  static async updateCategory(req: AuthRequest, res: Response) {
    try {
      const { categoryId } = req.params;
      const { name } = req.body;
      const category = await catalogService.updateCategory(
        categoryId,
        req.user!.id,
        name,
      );
      res.status(200).json({
        success: true,
        message: "Category updated",
        data: category,
      });
    } catch (error) {
      logger.error("Error in updateCategory:", error);
      throw error;
    }
  }

  static async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const { categoryId } = req.params;
      const result = await catalogService.deleteCategory(
        categoryId,
        req.user!.id,
      );
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error in deleteCategory:", error);
      throw error;
    }
  }

  static async getCategories(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await catalogService.getVendorCategories(
        req.user!.id,
        page,
        limit,
      );
      res.status(200).json({
        success: true,
        data: result.categories,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error("Error in getCategories:", error);
      throw error;
    }
  }

  // Order operations
  static async getOrders(req: AuthRequest, res: Response) {
    try {
      const vendorId = req.user!.id;
      const status = req.query.status as OrderStatus;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await vendorService.getVendorOrders(
        vendorId,
        status,
        page,
        limit,
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      logger.error("Error in VendorController.getOrders:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
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
