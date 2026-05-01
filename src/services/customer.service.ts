import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { createOTPVerification, verifyOTP } from "../utils/otp";
import EmailService from "./email.service";
import { UserRole, OrderStatus, VerificationStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";
import { SmsService } from "./sms-service";

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
  static async deleteAccount(customerId: string) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new CustomError("Customer account not found", 404, "NOT_FOUND");
      }

      await prisma.customer.delete({
        where: { id: customerId },
      });

      logger.info(`Customer account deleted: ${customerId}`);

      return {
        success: true,
        message:
          "Your account and all associated data have been permanently deleted.",
      };
    } catch (error) {
      logger.error("Error in customer account deletion:", error);
      throw error;
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
      const customer = await prisma.customer.findFirst({
        where: email ? { email } : { phone: phoneNumber },
      });

      if (!customer) {
        throw new CustomError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
      }

      const otp = await createOTPVerification(
        target,
        UserRole.CUSTOMER,
        customer.id,
      );

      if (phoneNumber) {
        await SmsService.sendSms({
          recipient: phoneNumber,
          content: `Your new Chariot Connect verification code is ${otp.code}. It expires in 15 mins.`,
          sender: "Chariot",
          tag: "resend-otp",
        });
        logger.info(`OTP resent to phone: ${phoneNumber}`);
      } else {
        await EmailService.sendOTPEmail(email!, otp.code, customer.firstName);
        logger.info(`OTP resent to email: ${email}`);
      }

      return {
        success: true,
        message: `A new OTP has been sent to your ${phoneNumber ? "phone" : "email"}.`,
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error resending OTP:", error);
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

      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: email || undefined },
            { phoneNumber: phoneNumber || undefined },
          ],
        },
      });

      if (!customer) {
        throw new CustomError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
      }

      const identifier = phoneNumber || email!;
      const otp = await createOTPVerification(
        identifier,
        UserRole.CUSTOMER,
        customer.id,
      );

      if (phoneNumber) {
        await SmsService.sendSms({
          recipient: phoneNumber,
          content: `Your Chariot Connect password reset code is ${otp.code}. Expires in 15 mins.`,
          sender: "Chariot",
          tag: "forgot-password",
        });
        logger.info(`Forgot password OTP sent to phone: ${phoneNumber}`);
      } else {
        await EmailService.sendOTPEmail(email!, otp.code, customer.firstName);
        logger.info(`Forgot password OTP sent to email: ${email}`);
      }

      return {
        success: true,
        message: `Password reset OTP sent to ${phoneNumber ? "phone" : "email"}`,
        identifier,
        otpExpiry: otp.expiresAt,
      };
    } catch (error) {
      logger.error("Error in forgotPasswordStep1:", error);
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

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const hashedPassword = await hashPassword(newPassword);

      await prisma.customer.update({
        where: email ? { email } : { phone: phoneNumber },
        data: { password: hashedPassword },
      });

      logger.info(`Password successfully reset for customer: ${target}`);

      return {
        success: true,
        message:
          "Password reset successful. You can now login with your new password.",
      };
    } catch (error) {
      logger.error("Error in forgotPasswordStep2:", error);
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

  static async loginWithPassword(data: {
    identifier: string;
    password: string;
  }) {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [{ email: data.identifier }, { phone: data.identifier }],
        },
      });

      if (!customer) {
        throw new CustomError(
          "Invalid credentials",
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
          "Invalid credentials",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      const token = generateToken({
        id: customer.id,
        email: customer.email,
        userType: UserRole.CUSTOMER,
      });

      logger.info(`Customer logged in: ${customer.email}`);

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
          currentLocation: true,
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
  static async getCustomerOrders(
    customerId: string,
    status?: OrderStatus,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [orders, total] = await prisma.$transaction([
        prisma.order.findMany({
          where: {
            customerId,
            ...(status && { status }),
          },
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                profilePhotoUrl: true,
              },
            },
            rider: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.order.count({
          where: {
            customerId,
            ...(status && { status }),
          },
        }),
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
      logger.error("Error fetching customer orders:", error);
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
          gender: data.gender || undefined,
          country: data.country || undefined,
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
          gender: true,
          country: true,
          email: true,
          phone: true,
          profilePhotoUrl: true,
          currentLocation: true,
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
