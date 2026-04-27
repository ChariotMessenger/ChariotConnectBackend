import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { generateToken } from "../utils/jwt";
import { createOTPVerification, verifyOTP } from "../utils/otp";
import EmailService from "./email.service";
import {
  UserRole,
  OrderStatus,
  VerificationStatus,
  OnlineStatus,
} from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";
import { hashPassword, comparePassword } from "../utils/password";

export class RiderService {
  static async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthday: string;
    gender: string;
    country: string;
    state: string;
    areaOfWork: string;
    drivingLicenseUrl: string;
    password: string;
    ninNumber: string;
    idCardUrl: string;
    bikePlateNumber: string;
    guarantorName: string;
    guarantorRelationship: string;
    guarantorPhone: string;
    guarantorNin: string;
    guarantorIdCardUrl: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    verifyIdentityUrl: string;
  }) {
    try {
      // Check if rider already exists
      const existingRider = await prisma.rider.findFirst({
        where: {
          OR: [{ email: data.email }, { phone: data.phone }],
        },
      });

      if (existingRider) {
        throw new CustomError(
          "Email or phone already registered",
          400,
          "RIDER_EXISTS",
        );
      }

      const hashedPassword = await hashPassword(data.password);

      // Create rider
      const rider = await prisma.rider.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          birthday: new Date(data.birthday),
          gender: data.gender,
          country: data.country,
          state: data.state,
          areaOfWork: data.areaOfWork,
          drivingLicenseUrl: data.drivingLicenseUrl,
          ninNumber: data.ninNumber,
          idCardUrl: data.idCardUrl,
          bikePlateNumber: data.bikePlateNumber,
          guarantorName: data.guarantorName,
          guarantorRelationship: data.guarantorRelationship,
          guarantorPhone: data.guarantorPhone,
          guarantorNin: data.guarantorNin,
          guarantorIdCardUrl: data.guarantorIdCardUrl,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          verifyIdentityUrl: data.verifyIdentityUrl,
          verificationStatus: VerificationStatus.PENDING,
        },
      });

      logger.info(`Rider registered for verification: ${rider.email}`);

      return {
        success: true,
        message:
          "Rider registered successfully. Your documents are under review.",
        rider: {
          id: rider.id,
          firstName: rider.firstName,
          lastName: rider.lastName,
          email: rider.email,
          phone: rider.phone,
          verificationStatus: rider.verificationStatus,
        },
      };
    } catch (error) {
      logger.error("Error in rider registration:", error);
      throw error;
    }
  }

  static async resendOTP(email: string) {
    try {
      const rider = await prisma.rider.findUnique({
        where: { email },
      });

      if (!rider) {
        throw new CustomError(
          "Rider with this email does not exist",
          404,
          "RIDER_NOT_FOUND",
        );
      }

      const otp = await createOTPVerification(email, UserRole.RIDER, rider.id);

      await EmailService.sendOTPEmail(email, otp.code, rider.firstName);

      logger.info(`OTP resent to rider: ${email}`);

      return {
        success: true,
        message: "A new OTP has been sent to your email.",
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error resending OTP for rider:", error);
      throw error;
    }
  }

  static async verifyEmail(email: string, otp: string) {
    try {
      const verifiedOtp = await verifyOTP(email, otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const rider = await prisma.rider.update({
        where: { email },
        data: { isEmailVerified: true },
      });

      logger.info(`Email verified for rider: ${email}`);

      return {
        success: true,
        message: "Email verified successfully.",
      };
    } catch (error) {
      logger.error("Error in rider email verification:", error);
      throw error;
    }
  }

  static async loginStep1(email: string) {
    try {
      // Check if rider exists
      const rider = await prisma.rider.findUnique({
        where: { email },
      });

      if (!rider) {
        throw new CustomError("Email not found", 404, "EMAIL_NOT_FOUND");
      }

      // Create OTP
      const otp = await createOTPVerification(email, UserRole.RIDER, rider.id);

      // Send OTP to email
      await EmailService.sendOTPEmail(email, otp.code, rider.firstName);

      logger.info(`Rider login OTP sent to ${email}`);

      return {
        success: true,
        message: "OTP sent to email",
        email,
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error in rider login step 1:", error);
      throw error;
    }
  }

  static async loginStep2(email: string, otp: string) {
    try {
      // Verify OTP
      const verifiedOtp = await verifyOTP(email, otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      // Get rider
      const rider = await prisma.rider.findUnique({
        where: { email },
      });

      if (!rider) {
        throw new CustomError("Rider not found", 404, "RIDER_NOT_FOUND");
      }

      // Check if rider is verified
      if (!rider.verified) {
        return {
          success: false,
          message:
            "Your account is pending verification. Please check back later.",
          verificationStatus: rider.verificationStatus,
        };
      }

      // Generate token
      const token = generateToken({
        id: rider.id,
        email: rider.email,
        userType: UserRole.RIDER,
      });

      logger.info(`Rider logged in: ${email}`);

      return {
        success: true,
        message: "Rider logged in successfully",
        token,
        rider: {
          id: rider.id,
          firstName: rider.firstName,
          lastName: rider.lastName,
          email: rider.email,
          phone: rider.phone,
          state: rider.state,
          areaOfWork: rider.areaOfWork,
          onlineStatus: rider.onlineStatus,
          profilePhotoUrl: rider.profilePhotoUrl,
        },
      };
    } catch (error) {
      logger.error("Error in rider login step 2:", error);
      throw error;
    }
  }
  static async loginWithPassword(data: {
    identifier: string;
    password: string;
  }) {
    try {
      const rider = await prisma.rider.findFirst({
        where: {
          OR: [{ email: data.identifier }, { phone: data.identifier }],
        },
      });

      if (!rider) {
        throw new CustomError(
          "Invalid credentials",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      const isPasswordValid = await comparePassword(
        data.password,
        rider.password,
      );
      if (!isPasswordValid) {
        throw new CustomError(
          "Invalid credentials",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      if (!rider.verified) {
        throw new CustomError(
          "Your account is pending verification. Access denied.",
          403,
          "ACCOUNT_NOT_VERIFIED",
        );
      }

      const token = generateToken({
        id: rider.id,
        email: rider.email,
        userType: UserRole.RIDER,
      });

      logger.info(`Rider logged in with password: ${rider.email}`);

      return {
        success: true,
        message: "Login successful",
        token,
        rider: {
          id: rider.id,
          firstName: rider.firstName,
          lastName: rider.lastName,
          email: rider.email,
          onlineStatus: rider.onlineStatus,
        },
      };
    } catch (error) {
      logger.error("Error in rider password login:", error);
      throw error;
    }
  }
  static async deleteAccount(riderId: string) {
    try {
      const rider = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        throw new CustomError("Rider account not found", 404, "NOT_FOUND");
      }

      await prisma.rider.delete({
        where: { id: riderId },
      });

      logger.info(`Rider account deleted: ${riderId}`);

      return {
        success: true,
        message:
          "Your rider account and documents have been permanently deleted.",
      };
    } catch (error) {
      logger.error("Error in rider account deletion:", error);
      throw error;
    }
  }
  static async getProfile(riderId: string) {
    try {
      const rider = await prisma.rider.findUnique({
        where: { id: riderId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          birthday: true,
          gender: true,
          country: true,
          state: true,
          areaOfWork: true,
          bikePlateNumber: true,
          bankName: true,
          currentLocation: true,
          accountName: true,
          profilePhotoUrl: true,
          onlineStatus: true,
          verificationStatus: true,
          createdAt: true,
        },
      });

      if (!rider) {
        throw new CustomError("Rider not found", 404, "RIDER_NOT_FOUND");
      }

      logger.info(`Rider profile fetched: ${riderId}`);
      return rider;
    } catch (error) {
      logger.error("Error fetching rider profile:", error);
      throw error;
    }
  }

  static async updateProfile(riderId: string, data: any) {
    try {
      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: {
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          phone: data.phone || undefined,
          areaOfWork: data.areaOfWork || undefined,
          gender: data.gender || undefined,
          state: data.state || undefined,
          country: data.country || undefined,
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
          email: true,
          phone: true,
          currentLocation: true,
        },
      });

      logger.info(`Rider profile updated: ${riderId}`);
      return rider;
    } catch (error) {
      logger.error("Error updating rider profile:", error);
      throw error;
    }
  }
  static async updateProfilePhoto(riderId: string, photoUrl: string) {
    try {
      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: { profilePhotoUrl: photoUrl },
      });

      logger.info(`Rider profile photo updated: ${riderId}`);
      return rider;
    } catch (error) {
      logger.error("Error updating rider profile photo:", error);
      throw error;
    }
  }

  static async goOnline(riderId: string) {
    try {
      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: { onlineStatus: OnlineStatus.ONLINE },
      });

      logger.info(`Rider ${riderId} is now online`);
      return rider;
    } catch (error) {
      logger.error("Error setting rider online:", error);
      throw error;
    }
  }

  static async getNearbyAvailableOrders(
    lat: number,
    lng: number,
    radiusInKm: number = 5,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const kmPerDegree = 111;
      const latDelta = radiusInKm / kmPerDegree;
      const lngDelta =
        radiusInKm / (kmPerDegree * Math.cos(lat * (Math.PI / 180)));
      const skip = (page - 1) * limit;

      const orders = await prisma.order.findMany({
        where: {
          status: OrderStatus.AWAITING_PICK_UP,
          riderId: null,
          pickupLocation: {
            is: {
              latitude: { gte: lat - latDelta, lte: lat + latDelta },
              longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
            },
          },
        },
        include: {
          vendor: { select: { businessName: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });

      return orders;
    } catch (error) {
      logger.error("Error fetching nearby orders:", error);
      throw error;
    }
  }
  static async goOffline(riderId: string) {
    try {
      const rider = await prisma.rider.update({
        where: { id: riderId },
        data: { onlineStatus: OnlineStatus.OFFLINE },
      });

      logger.info(`Rider ${riderId} is now offline`);
      return rider;
    } catch (error) {
      logger.error("Error setting rider offline:", error);
      throw error;
    }
  }

  static async getOnlineRiders(state: string) {
    try {
      const riders = await prisma.rider.findMany({
        where: {
          state,
          onlineStatus: OnlineStatus.ONLINE,
          verified: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          areaOfWork: true,
          bikePlateNumber: true,
          profilePhotoUrl: true,
        },
      });

      logger.info(`Online riders fetched for state: ${state}`);
      return riders;
    } catch (error) {
      logger.error("Error fetching online riders:", error);
      throw error;
    }
  }
}

export const riderService = RiderService;
