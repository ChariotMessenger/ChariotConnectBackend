import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { createOTPVerification, verifyOTP } from "../utils/otp";
import EmailService from "./email.service";
import { UserRole, VerificationStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";

interface Point {
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export class VendorService {
  static async registerStep1(data: {
    country: string;
    businessType: string;
    businessName: string;
    businessAddress: Point;
    isOwner: boolean;
    businessOwnerName?: string;
    isBusinessRegistered: boolean;
  }) {
    try {
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

  static async deleteAccount(vendorId: string) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
      });

      if (!vendor) {
        throw new CustomError("Vendor account not found", 404, "NOT_FOUND");
      }

      await prisma.vendor.delete({
        where: { id: vendorId },
      });

      logger.info(`Vendor account and associated data deleted: ${vendorId}`);

      return {
        success: true,
        message:
          "Your business account and all associated data have been permanently removed.",
      };
    } catch (error) {
      logger.error("Error in vendor account deletion:", error);
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
    businessAddress: Point;
    isOwner: boolean;
    businessOwnerName?: string;
    isBusinessRegistered: boolean;
    receiveMarketingEmails: boolean;
    password: string;
  }) {
    try {
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

      const otp = await createOTPVerification(data.email, UserRole.VENDOR);

      await EmailService.sendOTPEmail(data.email, otp.code, data.firstName);

      logger.info(`Vendor registration Step 2 initiated for ${data.email}`);

      return {
        success: true,
        message: "OTP sent to email. Please verify to complete registration.",
        email: data.email,
        otpExpiry: otp.expiresAt,
        registrationData: data,
      };
    } catch (error) {
      logger.error("Error in vendor registration step 2:", error);
      throw error;
    }
  }

  static async resendOTP(email: string) {
    try {
      const otp = await createOTPVerification(email, UserRole.VENDOR);
      await EmailService.sendOTPEmail(email, otp.code);

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
    businessAddress: Point;
    isOwner: boolean;
    businessOwnerName?: string;
    isBusinessRegistered: boolean;
    receiveMarketingEmails: boolean;
    password: string;
  }) {
    try {
      const verifiedOtp = await verifyOTP(data.email, data.otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const hashedPassword = await hashPassword(data.password);

      const vendor = await prisma.vendor.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          country: data.country,
          businessType: data.businessType,
          businessName: data.businessName,
          businessAddress: {
            set: {
              latitude: data.businessAddress.latitude,
              longitude: data.businessAddress.longitude,
            },
          },
          isOwner: data.isOwner,
          businessOwnerName: data.businessOwnerName || null,
          isBusinessRegistered: data.isBusinessRegistered,
          password: hashedPassword,
          receiveMarketingEmails: data.receiveMarketingEmails,
          verificationStatus: VerificationStatus.PENDING,
        },
      });

      const token = generateToken({
        id: vendor.id,
        email: vendor.email,
        userType: UserRole.VENDOR,
      });

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
      const vendor = await prisma.vendor.findUnique({
        where: { email },
      });

      if (!vendor) {
        throw new CustomError("Email not found", 404, "EMAIL_NOT_FOUND");
      }

      const otp = await createOTPVerification(
        email,
        UserRole.VENDOR,
        vendor.id,
      );

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

  static async forgotPasswordStep1(email: string) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { email },
      });

      if (!vendor) {
        throw new CustomError(
          "Vendor with this email does not exist",
          404,
          "VENDOR_NOT_FOUND",
        );
      }

      const otp = await createOTPVerification(
        email,
        UserRole.VENDOR,
        vendor.id,
      );

      await EmailService.sendOTPEmail(email, otp.code, vendor.firstName);

      logger.info(`Vendor forgot password OTP sent to ${email}`);

      return {
        success: true,
        message: "Password reset OTP sent to email",
        email,
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error in vendor forgotPasswordStep1:", error);
      throw error;
    }
  }

  static async forgotPasswordStep2(data: {
    email: string;
    otp: string;
    newPassword: string;
  }) {
    try {
      const verifiedOtp = await verifyOTP(data.email, data.otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const hashedPassword = await hashPassword(data.newPassword);

      await prisma.vendor.update({
        where: { email: data.email },
        data: { password: hashedPassword },
      });

      logger.info(`Password successfully reset for vendor: ${data.email}`);

      return {
        success: true,
        message:
          "Password reset successful. You can now login with your new password.",
      };
    } catch (error) {
      logger.error("Error in vendor forgotPasswordStep2:", error);
      throw error;
    }
  }

  static async verifyLoginOTP(email: string, otp: string) {
    try {
      const verifiedOtp = await verifyOTP(email, otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const vendor = await prisma.vendor.findUnique({
        where: { email },
      });

      if (!vendor) {
        throw new CustomError("Vendor not found", 404, "VENDOR_NOT_FOUND");
      }

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

  static async loginWithPassword(data: {
    identifier: string;
    password: string;
  }) {
    try {
      const vendor = await prisma.vendor.findFirst({
        where: {
          OR: [{ email: data.identifier }, { phone: data.identifier }],
        },
      });

      if (!vendor) {
        throw new CustomError(
          "Invalid credentials",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      const isPasswordValid = await comparePassword(
        data.password,
        vendor.password,
      );

      if (!isPasswordValid) {
        throw new CustomError(
          "Invalid credentials",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      const token = generateToken({
        id: vendor.id,
        email: vendor.email,
        userType: UserRole.VENDOR,
      });

      logger.info(`Vendor logged in: ${vendor.email}`);

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
          phone: vendor.phone,
          country: vendor.country,
          verificationStatus: vendor.verificationStatus,
          profilePhotoUrl: vendor.profilePhotoUrl,
        },
      };
    } catch (error) {
      logger.error("Error in vendor login with password service:", error);
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
          currentLocation: true,
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
          businessAddress: data.businessAddress
            ? {
                set: {
                  latitude: data.businessAddress.latitude,
                  longitude: data.businessAddress.longitude,
                  locationName: data.businessAddress.locationName,
                },
              }
            : undefined,
          receiveMarketingEmails:
            data.receiveMarketingEmails !== undefined
              ? data.receiveMarketingEmails
              : undefined,
          currentLocation: data.currentLocation
            ? {
                set: {
                  latitude: data.currentLocation.latitude,
                  longitude: data.currentLocation.longitude,
                  locationName: data.currentLocation.locationName,
                },
              }
            : undefined,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          businessName: true,
          email: true,
          currentLocation: true,
          businessAddress: true,
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
  static async getVendorOrders(
    vendorId: string,
    status?: OrderStatus,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
      const whereClause = {
        vendorId,
        ...(status && { status }),
      };

      const [orders, total] = await prisma.$transaction([
        prisma.order.findMany({
          where: whereClause,
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                profilePhotoUrl: true,
              },
            },
            rider: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.order.count({ where: whereClause }),
      ]);

      return {
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching vendor orders:", error);
      throw error;
    }
  }
  static async getVendorsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const kmPerDegree = 111;
      const latDelta = radiusKm / kmPerDegree;
      const lngDelta =
        radiusKm / (kmPerDegree * Math.cos(latitude * (Math.PI / 180)));
      const skip = (page - 1) * limit;

      const whereClause = {
        verified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        businessAddress: {
          is: {
            latitude: {
              gte: latitude - latDelta,
              lte: latitude + latDelta,
            },
            longitude: {
              gte: longitude - lngDelta,
              lte: longitude + lngDelta,
            },
          },
        },
      };

      const [vendors, total] = await prisma.$transaction([
        prisma.vendor.findMany({
          where: whereClause,
          select: {
            id: true,
            businessName: true,
            businessType: true,
            businessAddress: true,
            phone: true,
            profilePhotoUrl: true,
            createdAt: true,
          },
          skip,
          take: limit,
          orderBy: { businessName: "asc" },
        }),
        prisma.vendor.count({ where: whereClause }),
      ]);

      return {
        vendors,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching vendors by location:", error);
      throw error;
    }
  }
}

export const vendorService = VendorService;
