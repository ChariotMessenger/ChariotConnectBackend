import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { createOTPVerification, verifyOTP } from "../utils/otp";
import EmailService from "./email.service";
import { UserRole, VerificationStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";

export class VendorService {
  static async registerStep1(data: {
    country: string;
    businessType: string;
    businessName: string;
    businessAddress: string;
    isOwner: boolean;
    businessOwnerName?: string;
    isBusinessRegistered: boolean;
  }) {
    try {
      // Store in session or temp storage (for this step we just validate and return)
      logger.info(
        `Vendor registration Step 1 initiated for business: ${data.businessName}`,
      );

      return {
        success: true,
        message: "Business information validated. Proceed to Step 2.",
        data,
      };
    } catch (error) {
      logger.error("Error in vendor registration step 1:", error);
      throw error;
    }
  }

  static async registerStep2(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    businessType: string;
    businessName: string;
    businessAddress: string;
    isOwner: boolean;
    businessOwnerName?: string;
    isBusinessRegistered: boolean;
    receiveMarketingEmails: boolean;
    password: string;
  }) {
    try {
      // Check if vendor already exists
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          OR: [{ email: data.email }, { phone: data.phone }],
        },
      });

      if (existingVendor) {
        if (existingVendor.email === data.email) {
          throw new CustomError(
            "Email already registered",
            400,
            "EMAIL_EXISTS",
          );
        }
        if (existingVendor.phone === data.phone) {
          throw new CustomError(
            "Phone number already registered",
            400,
            "PHONE_EXISTS",
          );
        }
      }

      // Create OTP
      const otp = await createOTPVerification(data.email, UserRole.VENDOR);

      // Send OTP to email
      await EmailService.sendOTPEmail(data.email, otp.code, data.firstName);

      logger.info(`Vendor registration Step 2 initiated for ${data.email}`);

      // Store registration data temporarily (you might use Redis or sessions for this)
      // For now, we'll return the OTP sent message
      return {
        success: true,
        message: "OTP sent to email. Please verify to complete registration.",
        email: data.email,
        otpExpiry: otp.expiresAt,
        registrationData: data, // In production, store this in Redis/session
      };
    } catch (error) {
      logger.error("Error in vendor registration step 2:", error);
      throw error;
    }
  }

  static async resendOTP(email: string, firstName: string) {
    try {
      const otp = await createOTPVerification(email, UserRole.VENDOR);
      await EmailService.sendOTPEmail(email, otp.code, firstName);

      logger.info(`OTP resent to vendor: ${email}`);

      return {
        success: true,
        message: "A new OTP has been sent to your email.",
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error resending vendor OTP:", error);
      throw error;
    }
  }

  static async registerStep3(data: {
    email: string;
    otp: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    businessType: string;
    businessName: string;
    businessAddress: string;
    isOwner: boolean;
    businessOwnerName?: string;
    isBusinessRegistered: boolean;
    receiveMarketingEmails: boolean;
    password: string;
  }) {
    try {
      // Verify OTP
      const verifiedOtp = await verifyOTP(data.email, data.otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create vendor
      const vendor = await prisma.vendor.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          country: data.country,
          businessType: data.businessType,
          businessName: data.businessName,
          businessAddress: data.businessAddress,
          isOwner: data.isOwner,
          businessOwnerName: data.businessOwnerName || null,
          isBusinessRegistered: data.isBusinessRegistered,
          password: hashedPassword,
          receiveMarketingEmails: data.receiveMarketingEmails,
          verificationStatus: VerificationStatus.PENDING,
        },
      });

      // Generate token
      const token = generateToken({
        id: vendor.id,
        email: vendor.email,
        userType: UserRole.VENDOR,
      });

      // Send welcome email
      await EmailService.sendWelcomeEmail(
        vendor.email,
        `${vendor.firstName} ${vendor.lastName}`,
        "Vendor",
      );

      logger.info(`Vendor registered successfully: ${vendor.email}`);

      return {
        success: true,
        message: "Vendor registered successfully. Awaiting verification.",
        token,
        vendor: {
          id: vendor.id,
          firstName: vendor.firstName,
          lastName: vendor.lastName,
          businessName: vendor.businessName,
          email: vendor.email,
          phone: vendor.phone,
          country: vendor.country,
          verificationStatus: vendor.verificationStatus,
          profilePhotoUrl: vendor.profilePhotoUrl,
        },
      };
    } catch (error) {
      logger.error("Error in vendor registration step 3:", error);
      throw error;
    }
  }

  static async loginWithOTP(email: string) {
    try {
      // Check if vendor exists
      const vendor = await prisma.vendor.findUnique({
        where: { email },
      });

      if (!vendor) {
        throw new CustomError("Email not found", 404, "EMAIL_NOT_FOUND");
      }

      // Create OTP
      const otp = await createOTPVerification(
        email,
        UserRole.VENDOR,
        vendor.id,
      );

      // Send OTP to email
      await EmailService.sendOTPEmail(email, otp.code, vendor.firstName);

      logger.info(`Vendor login OTP sent to ${email}`);

      return {
        success: true,
        message: "OTP sent to email",
        email,
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error in vendor login with OTP step 1:", error);
      throw error;
    }
  }

  static async verifyLoginOTP(email: string, otp: string) {
    try {
      // Verify OTP
      const verifiedOtp = await verifyOTP(email, otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      // Get vendor
      const vendor = await prisma.vendor.findUnique({
        where: { email },
      });

      if (!vendor) {
        throw new CustomError("Vendor not found", 404, "VENDOR_NOT_FOUND");
      }

      // Generate token
      const token = generateToken({
        id: vendor.id,
        email: vendor.email,
        userType: UserRole.VENDOR,
      });

      logger.info(`Vendor logged in with OTP: ${email}`);

      return {
        success: true,
        message: "Vendor logged in successfully",
        token,
        vendor: {
          id: vendor.id,
          firstName: vendor.firstName,
          lastName: vendor.lastName,
          businessName: vendor.businessName,
          email: vendor.email,
          country: vendor.country,
          verificationStatus: vendor.verificationStatus,
          profilePhotoUrl: vendor.profilePhotoUrl,
        },
      };
    } catch (error) {
      logger.error("Error in vendor login with OTP step 2:", error);
      throw error;
    }
  }

  static async loginWithPassword(email: string, password: string) {
    try {
      // Get vendor
      const vendor = await prisma.vendor.findUnique({
        where: { email },
      });

      if (!vendor) {
        throw new CustomError("Email not found", 404, "EMAIL_NOT_FOUND");
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, vendor.password);

      if (!isPasswordValid) {
        throw new CustomError("Invalid password", 401, "INVALID_PASSWORD");
      }

      // Generate token
      const token = generateToken({
        id: vendor.id,
        email: vendor.email,
        userType: UserRole.VENDOR,
      });

      logger.info(`Vendor logged in with password: ${email}`);

      return {
        success: true,
        message: "Vendor logged in successfully",
        token,
        vendor: {
          id: vendor.id,
          firstName: vendor.firstName,
          lastName: vendor.lastName,
          businessName: vendor.businessName,
          email: vendor.email,
          country: vendor.country,
          verificationStatus: vendor.verificationStatus,
          profilePhotoUrl: vendor.profilePhotoUrl,
        },
      };
    } catch (error) {
      logger.error("Error in vendor login with password:", error);
      throw error;
    }
  }

  static async getProfile(vendorId: string) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          country: true,
          businessType: true,
          businessName: true,
          businessAddress: true,
          isOwner: true,
          isBusinessRegistered: true,
          profilePhotoUrl: true,
          verificationStatus: true,
          receiveMarketingEmails: true,
          createdAt: true,
        },
      });

      if (!vendor) {
        throw new CustomError("Vendor not found", 404, "VENDOR_NOT_FOUND");
      }

      logger.info(`Vendor profile fetched: ${vendorId}`);
      return vendor;
    } catch (error) {
      logger.error("Error fetching vendor profile:", error);
      throw error;
    }
  }

  static async updateProfile(vendorId: string, data: any) {
    try {
      const vendor = await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          phone: data.phone || undefined,
          businessName: data.businessName || undefined,
          businessAddress: data.businessAddress || undefined,
          receiveMarketingEmails:
            data.receiveMarketingEmails !== undefined
              ? data.receiveMarketingEmails
              : undefined,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          businessName: true,
          email: true,
        },
      });

      logger.info(`Vendor profile updated: ${vendorId}`);
      return vendor;
    } catch (error) {
      logger.error("Error updating vendor profile:", error);
      throw error;
    }
  }

  static async updateProfilePhoto(vendorId: string, photoUrl: string) {
    try {
      const vendor = await prisma.vendor.update({
        where: { id: vendorId },
        data: { profilePhotoUrl: photoUrl },
      });

      logger.info(`Vendor profile photo updated: ${vendorId}`);
      return vendor;
    } catch (error) {
      logger.error("Error updating vendor profile photo:", error);
      throw error;
    }
  }

  static async getVendorsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ) {
    try {
      // Get all vendors - in production, use geospatial queries
      // For now, returning all verified vendors
      const vendors = await prisma.vendor.findMany({
        where: {
          verified: true,
          verificationStatus: VerificationStatus.VERIFIED,
        },
        select: {
          id: true,
          businessName: true,
          businessType: true,
          businessAddress: true,
          phone: true,
          profilePhotoUrl: true,
          createdAt: true,
        },
      });

      logger.info(`Vendors fetched for location: ${latitude}, ${longitude}`);
      return vendors;
    } catch (error) {
      logger.error("Error fetching vendors by location:", error);
      throw error;
    }
  }
}

export const vendorService = VendorService;
