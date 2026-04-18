import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { createOTPVerification, verifyOTP } from "../utils/otp";
import EmailService from "./email.service";
import { UserRole, VerificationStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";

export class CustomerService {
  static async registerStep1(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    birthday: string;
    gender: string;
    country: string;
    receiveMarketingEmails: boolean;
  }) {
    try {
      const existingUser = await prisma.customer.findFirst({
        where: {
          OR: [{ email: data.email }, { phone: data.phone }],
        },
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new CustomError(
            "Email already registered",
            400,
            "EMAIL_EXISTS",
          );
        }
        if (existingUser.phone === data.phone) {
          throw new CustomError(
            "Phone number already registered",
            400,
            "PHONE_EXISTS",
          );
        }
      }

      const otp = await createOTPVerification(data.email, UserRole.CUSTOMER);

      await EmailService.sendOTPEmail(data.email, otp.code, data.firstName);

      logger.info(`Customer registration Step 1 initiated for ${data.email}`);

      return {
        success: true,
        message: "OTP sent to email. Please verify to continue registration.",
        email: data.email,
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error in customer registration step 1:", error);
      throw error;
    }
  }

  static async resendOTP(email: string, firstName: string) {
    try {
      const otp = await createOTPVerification(email, UserRole.CUSTOMER);
      await EmailService.sendOTPEmail(email, otp.code, firstName);

      logger.info(`OTP resent to ${email}`);

      return {
        success: true,
        message: "A new OTP has been sent to your email.",
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error resending OTP:", error);
      throw error;
    }
  }

  static async registerStep2(data: {
    email: string;
    otp: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    birthday: string;
    gender: string;
    country: string;
    receiveMarketingEmails: boolean;
  }) {
    try {
      const verifiedOtp = await verifyOTP(data.email, data.otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const hashedPassword = await hashPassword(data.password);

      const customer = await prisma.customer.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          birthday: new Date(data.birthday),
          gender: data.gender,
          country: data.country,
          password: hashedPassword,
          receiveMarketingEmails: data.receiveMarketingEmails,
        },
      });

      const token = generateToken({
        id: customer.id,
        email: customer.email,
        userType: UserRole.CUSTOMER,
      });

      await EmailService.sendWelcomeEmail(
        customer.email,
        `${customer.firstName} ${customer.lastName}`,
        "Customer",
      );

      logger.info(`Customer registered successfully: ${customer.email}`);

      return {
        success: true,
        message: "Customer registered successfully",
        token,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          country: customer.country,
          profilePhotoUrl: customer.profilePhotoUrl,
        },
      };
    } catch (error) {
      logger.error("Error in customer registration step 2:", error);
      throw error;
    }
  }

  static async loginWithPassword(data: { email: string; password: string }) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { email: data.email },
      });

      if (!customer) {
        throw new CustomError(
          "Invalid email or password",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      const isPasswordValid = await comparePassword(
        data.password,
        customer.password,
      );

      if (!isPasswordValid) {
        throw new CustomError(
          "Invalid email or password",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      const token = generateToken({
        id: customer.id,
        email: customer.email,
        userType: UserRole.CUSTOMER,
      });

      logger.info(`Customer logged in with password: ${data.email}`);

      return {
        success: true,
        message: "Login successful",
        token,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          country: customer.country,
          profilePhotoUrl: customer.profilePhotoUrl,
        },
      };
    } catch (error) {
      logger.error("Error in loginWithPassword:", error);
      throw error;
    }
  }

  static async loginStep1(email: string) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { email },
      });

      if (!customer) {
        throw new CustomError("Email not found", 404, "EMAIL_NOT_FOUND");
      }

      const otp = await createOTPVerification(
        email,
        UserRole.CUSTOMER,
        customer.id,
      );

      await EmailService.sendOTPEmail(email, otp.code, customer.firstName);

      logger.info(`Customer login OTP sent to ${email}`);

      return {
        success: true,
        message: "OTP sent to email",
        email,
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error in customer login step 1:", error);
      throw error;
    }
  }

  static async loginStep2(email: string, otp: string) {
    try {
      const verifiedOtp = await verifyOTP(email, otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const customer = await prisma.customer.findUnique({
        where: { email },
      });

      if (!customer) {
        throw new CustomError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
      }

      const token = generateToken({
        id: customer.id,
        email: customer.email,
        userType: UserRole.CUSTOMER,
      });

      logger.info(`Customer logged in: ${email}`);

      return {
        success: true,
        message: "Customer logged in successfully",
        token,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          country: customer.country,
          profilePhotoUrl: customer.profilePhotoUrl,
        },
      };
    } catch (error) {
      logger.error("Error in customer login step 2:", error);
      throw error;
    }
  }

  static async getProfile(customerId: string) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          birthday: true,
          gender: true,
          country: true,
          profilePhotoUrl: true,
          receiveMarketingEmails: true,
          createdAt: true,
        },
      });

      if (!customer) {
        throw new CustomError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
      }

      logger.info(`Customer profile fetched: ${customerId}`);
      return customer;
    } catch (error) {
      logger.error("Error fetching customer profile:", error);
      throw error;
    }
  }

  static async updateProfile(customerId: string, data: any) {
    try {
      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          phone: data.phone || undefined,
          receiveMarketingEmails:
            data.receiveMarketingEmails !== undefined
              ? data.receiveMarketingEmails
              : undefined,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profilePhotoUrl: true,
        },
      });

      logger.info(`Customer profile updated: ${customerId}`);
      return customer;
    } catch (error) {
      logger.error("Error updating customer profile:", error);
      throw error;
    }
  }

  static async updateProfilePhoto(customerId: string, photoUrl: string) {
    try {
      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: { profilePhotoUrl: photoUrl },
      });

      logger.info(`Customer profile photo updated: ${customerId}`);
      return customer;
    } catch (error) {
      logger.error("Error updating customer profile photo:", error);
      throw error;
    }
  }
}

export const customerService = CustomerService;
