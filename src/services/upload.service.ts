import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadService {
  private static async cleanup(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.error(`Failed to delete local file: ${filePath}`, error);
    }
  }

  static async uploadProfilePhoto(
    file: Express.Multer.File,
    userId: string,
    userType: string,
  ): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `chariot-connect/${userType.toLowerCase()}/profiles`,
        public_id: userId,
        overwrite: true,
        resource_type: "auto",
      });

      logger.info(`Profile photo uploaded for ${userType} ${userId}`);
      return result.secure_url;
    } catch (error) {
      logger.error("Error uploading profile photo:", error);
      throw error;
    } finally {
      // Always remove the file from local storage
      await this.cleanup(file.path);
    }
  }

  static async uploadDocument(
    file: Express.Multer.File,
    userId: string,
    documentType: string,
  ): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `chariot-connect/documents/${documentType}`,
        public_id: `${userId}-${Date.now()}`,
        resource_type: "auto",
      });

      logger.info(`Document uploaded for user ${userId}`);
      return result.secure_url;
    } catch (error) {
      logger.error("Error uploading document:", error);
      throw error;
    } finally {
      await this.cleanup(file.path);
    }
  }

  static async uploadCatalogImage(
    file: Express.Multer.File,
    vendorId: string,
    itemId: string,
  ): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `chariot-connect/vendors/${vendorId}/catalog`,
        public_id: itemId,
        overwrite: true,
        resource_type: "auto",
      });

      logger.info(`Catalog image uploaded for vendor ${vendorId}`);
      return result.secure_url;
    } catch (error) {
      logger.error("Error uploading catalog image:", error);
      throw error;
    } finally {
      await this.cleanup(file.path);
    }
  }

  static async deleteFile(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`File deleted from Cloudinary: ${publicId}`);
      return true;
    } catch (error) {
      logger.error("Error deleting file:", error);
      throw error;
    }
  }
}

export default UploadService;
