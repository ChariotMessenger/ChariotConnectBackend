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
import { SmsService } from "./sms-service";
import UploadService from "./upload.service";
import axios from "axios";

interface Point {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  fullAddress?: string;
  placeId?: string;
  tag?: string;
  shortAddress?: string;
}

export class RiderService {
  private static readonly PAYSTACK_URL = "https://api.paystack.co";

  static async validateStepOne(data: { email: string; phone: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingRider = await prisma.rider.findFirst({
      where: { OR: [{ email: normalizedEmail }, { phone: data.phone }] },
    });

    if (existingRider) {
      throw new CustomError(
        "Email or phone already registered",
        400,
        "RIDER_EXISTS",
      );
    }
    return { success: true };
  }

  static async processStepTwoDocs(email: string, files: any) {
    const identifier = email.replace(/[@.]/g, "_");

    const [drivingLicenseUrl, idCardUrl, guarantorIdCardUrl] =
      await Promise.all([
        files["drivingLicense"]
          ? UploadService.uploadDocument(
              files["drivingLicense"][0],
              identifier,
              "licenses",
            )
          : Promise.resolve(""),
        files["idCard"]
          ? UploadService.uploadDocument(
              files["idCard"][0],
              identifier,
              "id-cards",
            )
          : Promise.resolve(""),
        files["guarantorIdCard"]
          ? UploadService.uploadDocument(
              files["guarantorIdCard"][0],
              identifier,
              "guarantor-ids",
            )
          : Promise.resolve(""),
      ]);

    return { drivingLicenseUrl, idCardUrl, guarantorIdCardUrl };
  }

  static async finalizeRegistration(data: any) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const existingRider = await prisma.rider.findFirst({
      where: { OR: [{ email: normalizedEmail }, { phone: data.phone }] },
    });

    if (existingRider) {
      throw new CustomError(
        "Email or phone already registered",
        400,
        "RIDER_EXISTS",
      );
    }

    const hashedPassword = await hashPassword(data.password);
    const secureData = { ...data, password: hashedPassword };

    await prisma.pendingRider.upsert({
      where: { email: normalizedEmail },
      update: {
        registrationData: secureData,
        phone: data.phone,
      },
      create: {
        email: normalizedEmail,
        phone: data.phone,
        registrationData: secureData,
      },
    });

    return {
      success: true,
      message: "OTP sent. Please verify to complete registration.",
    };
  }

  static async getBanksByCountry(country: string) {
    try {
      // Paystack uses country codes (e.g., 'nigeria', 'ghana')
      const response = await axios.get(`${this.PAYSTACK_URL}/bank`, {
        params: { country: country.toLowerCase() },
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      return response.data.data; // Returns { name, code, type, etc. }
    } catch (error) {
      logger.error("Paystack Get Banks Error:", error);
      throw new CustomError("Failed to fetch banks", 500);
    }
  }

  static async validateAccount(bankCode: string, accountNumber: string) {
    try {
      const response = await axios.get(`${this.PAYSTACK_URL}/bank/resolve`, {
        params: { account_number: accountNumber, bank_code: bankCode },
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      // Returns { account_number, account_name, bank_id }
      return response.data.data;
    } catch (error) {
      logger.error("Paystack Resolve Account Error:", error);
      throw new CustomError("Invalid account number or bank selection", 400);
    }
  }

  static async resendOTP(data: { email?: string; phoneNumber?: string }) {
    try {
      const { email, phoneNumber } = data;

      if (!email && !phoneNumber) {
        throw new CustomError(
          "Email or Phone Number is required",
          400,
          "IDENTIFIER_REQUIRED",
        );
      }

      const target = email || phoneNumber!;
      const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

      const rider = await prisma.rider.findFirst({
        where: email ? { email: normalizedEmail } : { phone: phoneNumber },
      });

      if (!rider) {
        throw new CustomError("Rider not found", 404, "RIDER_NOT_FOUND");
      }

      const otp = await createOTPVerification(target, UserRole.RIDER, rider.id);

      if (phoneNumber) {
        await SmsService.sendSms({
          recipient: phoneNumber,
          content: `Your new Chariot Connect verification code is ${otp.code}. It expires in 15 mins.`,
          sender: "Chariot",
          tag: "resend-otp",
        });
        logger.info(`OTP resent to rider phone: ${phoneNumber}`);
      } else {
        await EmailService.sendOTPEmail(email!, otp.code, rider.firstName);
        logger.info(`OTP resent to rider email: ${email}`);
      }

      return {
        success: true,
        message: `A new OTP has been sent to your ${phoneNumber ? "phone" : "email"}.`,
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error resending rider OTP:", error);
      throw error;
    }
  }

  static async verifyAccount(data: {
    email?: string;
    phoneNumber?: string;
    otp: string;
  }) {
    try {
      const { email, phoneNumber, otp } = data;

      if (!email && !phoneNumber) {
        throw new CustomError(
          "Email or Phone Number is required",
          400,
          "IDENTIFIER_REQUIRED",
        );
      }

      const target = email || phoneNumber!;
      const verifiedOtp = await verifyOTP(target, otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const pending = await prisma.pendingRider.findFirst({
        where: email ? { email } : { phone: phoneNumber },
      });

      if (!pending) {
        throw new CustomError(
          "Registration session not found",
          404,
          "SESSION_NOT_FOUND",
        );
      }

      const regData = pending.registrationData as any;

      const newRider = await prisma.$transaction(async (tx) => {
        const rider = await tx.rider.create({
          data: {
            firstName: regData.firstName,
            lastName: regData.lastName,
            email: regData.email,
            phone: regData.phone,
            password: regData.password,
            birthday: new Date(regData.birthday),
            gender: regData.gender,
            country: regData.country,
            state: regData.state,
            areaOfWork: regData.areaOfWork,
            drivingLicenseUrl: regData.drivingLicenseUrl,
            ninNumber: regData.ninNumber,
            riderHomeAddress: regData.riderHomeAddress,
            idCardUrl: regData.idCardUrl,
            bikePlateNumber: regData.bikePlateNumber,
            guarantorName: regData.guarantorName,
            guarantorRelationship: regData.guarantorRelationship,
            guarantorPhone: regData.guarantorPhone,
            guarantorNin: regData.guarantorNin,
            guarantorIdCardUrl: regData.guarantorIdCardUrl,
            bankName: regData.bankName,
            accountNumber: regData.accountNumber,
            accountName: regData.accountName,
            verifyIdentityUrl: regData.verifyIdentityUrl,
            isEmailVerified: true,
            verificationStatus: VerificationStatus.PENDING,
          },
        });

        await tx.pendingRider.delete({ where: { id: pending.id } });
        return rider;
      });

      logger.info(`Rider created after verification: ${target}`);

      return {
        success: true,
        message: `${email ? "Email" : "Phone number"} verified and account created.`,
        rider: newRider,
      };
    } catch (error) {
      logger.error("Error in rider verification:", error);
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
      const normalizedIdentifier = data.identifier.trim().toLowerCase();

      const rider = await prisma.rider.findFirst({
        where: {
          OR: [
            { email: normalizedIdentifier },
            { phone: normalizedIdentifier },
          ],
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

      // if (!rider.verified) {
      //   throw new CustomError(
      //     "Your account is pending verification. Access denied.",
      //     403,
      //     "ACCOUNT_NOT_VERIFIED",
      //   );
      // }

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

  static async forgotPasswordStep1(data: {
    email?: string;
    phoneNumber?: string;
  }) {
    try {
      const { email, phoneNumber } = data;

      if (!email && !phoneNumber) {
        throw new CustomError(
          "Email or Phone Number is required",
          400,
          "IDENTIFIER_REQUIRED",
        );
      }
      const normalizedEmail = email?.trim().toLowerCase();

      const rider = await prisma.rider.findFirst({
        where: {
          OR: [
            { email: normalizedEmail || undefined },
            { phone: phoneNumber || undefined },
          ],
        },
      });

      if (!rider) {
        throw new CustomError(
          "Rider with this identifier does not exist",
          404,
          "RIDER_NOT_FOUND",
        );
      }

      const identifier = phoneNumber || email!;
      const otp = await createOTPVerification(
        identifier,
        UserRole.RIDER,
        rider.id,
      );

      if (phoneNumber) {
        await SmsService.sendSms({
          recipient: phoneNumber,
          content: `Your Chariot Connect password reset code is ${otp.code}. Expires in 15 mins.`,
          sender: "Chariot",
          tag: "forgot-password",
        });
        logger.info(`Rider forgot password OTP sent to phone: ${phoneNumber}`);
      } else {
        await EmailService.sendOTPEmail(email!, otp.code, rider.firstName);
        logger.info(`Rider forgot password OTP sent to email: ${email}`);
      }

      return {
        success: true,
        message: `Password reset OTP sent to ${phoneNumber ? "phone" : "email"}`,
        identifier,
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error in rider forgotPasswordStep1:", error);
      throw error;
    }
  }

  static async forgotPasswordStep2(data: {
    email?: string;
    phoneNumber?: string;
    otp: string;
    newPassword: string;
  }) {
    try {
      const { email, phoneNumber, otp, newPassword } = data;

      if (!email && !phoneNumber) {
        throw new CustomError(
          "Email or Phone Number is required",
          400,
          "IDENTIFIER_REQUIRED",
        );
      }

      const target = email || phoneNumber!;
      const verifiedOtp = await verifyOTP(target, otp);
      const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const rider = await prisma.rider.findFirst({
        where: email ? { email: normalizedEmail } : { phone: phoneNumber },
      });

      if (!rider) {
        throw new CustomError("Rider not found", 404, "RIDER_NOT_FOUND");
      }

      const hashedPassword = await hashPassword(newPassword);

      await prisma.rider.update({
        where: { id: rider.id },
        data: { password: hashedPassword },
      });

      logger.info(`Password successfully reset for rider ID: ${rider.id}`);

      return {
        success: true,
        message:
          "Password reset successful. You can now login with your new password.",
      };
    } catch (error) {
      logger.error("Error in rider forgotPasswordStep2:", error);
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
          riderHomeAddress: data.riderHomeAddress
            ? {
                set: {
                  latitude: data.riderHomeAddress.latitude,
                  longitude: data.riderHomeAddress.longitude,
                  locationName: data.riderHomeAddress.locationName,
                  tag: data.riderHomeAddress.tag,
                  fullAddress: data.riderHomeAddress.fullAddress,
                  placeId: data.riderHomeAddress.placeId,
                  shortAddress: data.riderHomeAddress.shortAddress,
                },
              }
            : undefined,
          currentLocation: data.currentLocation
            ? {
                set: {
                  latitude: data.currentLocation.latitude,
                  longitude: data.currentLocation.longitude,
                  locationName: data.currentLocation.locationName,
                  tag: data.currentLocation.tag,
                  fullAddress: data.currentLocation.fullAddress,
                  placeId: data.currentLocation.placeId,
                  shortAddress: data.currentLocation.shortAddress,
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

  static async getLocationHistory(
    riderId: string,
    limit: number = 20,
    page: number = 1,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [history, total] = await Promise.all([
        prisma.locationHistory.findMany({
          where: { riderId },
          orderBy: { capturedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.locationHistory.count({
          where: { riderId },
        }),
      ]);

      logger.info(`Fetched location history for rider: ${riderId}`);
      return {
        history,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching rider location history:", error);
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
