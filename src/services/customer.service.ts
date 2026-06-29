import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { createOTPVerification, verifyOTP } from "../utils/otp";
import EmailService from "./email.service";
import { UserRole, OrderStatus, VerificationStatus } from "@prisma/client";
import { CustomError } from "../middlewares/errorHandler";
import { SmsService } from "./sms-service";
import { PackGroup } from "./order.service";
import { OrderFilterStatus } from "../controllers/customer.controller";
import { formatOrderResponse } from "../utils/order-utils";
interface Point {
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  fullAddress?: string | null;
  shortAddress?: string | null;
  placeId?: string | null;
  tag?: string | null;
}

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
      const normalizedEmail = data.email.trim().toLowerCase();

      const existingUser = await prisma.customer.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { phone: data.phone }],
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

      const normalizedEmail = email?.trim().toLowerCase();

      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: normalizedEmail || undefined },
            { phone: phoneNumber || undefined },
          ],
        },
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
          content: `Your new Umali verification code is ${otp.code}. It expires in 15 mins.`,
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
      const normalizedEmail = email?.trim().toLowerCase();

      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: normalizedEmail || undefined },
            { phone: phoneNumber || undefined },
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
          content: `Your Umali password reset code is ${otp.code}. Expires in 15 mins.`,
          sender: "Umali",
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
      const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const hashedPassword = await hashPassword(newPassword);

      await prisma.customer.update({
        where: email ? { email: normalizedEmail } : { phone: phoneNumber },
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
      const normalizedEmail = data.email.trim().toLowerCase();
      const verifiedOtp = await verifyOTP(normalizedEmail, data.otp);

      if (!verifiedOtp) {
        throw new CustomError("Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const hashedPassword = await hashPassword(data.password);

      const customer = await prisma.customer.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: normalizedEmail,
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
      const normalizedIdentifier = data.identifier.trim().toLowerCase();

      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: normalizedIdentifier },
            { phone: normalizedIdentifier },
          ],
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
    status?: "ACTIVE" | "DELIVERED" | "CANCELLED_AND_REJECTED",
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      let statusCondition: any = undefined;
      if (status === "ACTIVE") {
        statusCondition = {
          in: [
            "WAITING_FOR_APPROVAL",
            "AWAITING_PAYMENT",
            "PAID",
            "ORDER_PACKED",
            "RIDER_EN_ROUTE_TO_VENDOR",
            "RIDER_EN_ROUTE_TO_CUSTOMER",
          ],
        };
      } else if (status === "DELIVERED") {
        statusCondition = "DELIVERED";
      } else if (status === "CANCELLED_AND_REJECTED") {
        statusCondition = {
          in: ["CANCELLED", "REJECTED"],
        };
      }

      let whereClause: any = {
        customerId,
      };

      if (status) {
        whereClause.status = statusCondition;
      } else {
        whereClause.status = {
          in: [
            "WAITING_FOR_APPROVAL",
            "AWAITING_PAYMENT",
            "PAID",
            "ORDER_PACKED",
            "RIDER_EN_ROUTE_TO_VENDOR",
            "RIDER_EN_ROUTE_TO_CUSTOMER",
            "DELIVERED",
            "CANCELLED",
            "REJECTED",
          ],
        };
      }

      const [orders, total, countsGroup] = await prisma.$transaction([
        prisma.order.findMany({
          where: whereClause,
          include: {
            vendor: true,
            customer: true,
            rider: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.order.count({
          where: whereClause,
        }),
        prisma.order.groupBy({
          by: ["status"],
          where: { customerId },
          _count: { status: true },
        } as any),
      ]);

      const rawCounts = (countsGroup as any[]).reduce(
        (acc, curr) => {
          if (curr && curr.status) {
            acc[curr.status] = curr._count?.status ?? 0;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      const statusCounts = {
        ACTIVE:
          (rawCounts["WAITING_FOR_APPROVAL"] ?? 0) +
          (rawCounts["AWAITING_PAYMENT"] ?? 0) +
          (rawCounts["PAID"] ?? 0) +
          (rawCounts["ORDER_PACKED"] ?? 0) +
          (rawCounts["RIDER_EN_ROUTE_TO_VENDOR"] ?? 0) +
          (rawCounts["RIDER_EN_ROUTE_TO_CUSTOMER"] ?? 0),
        DELIVERED: rawCounts["DELIVERED"] ?? 0,
        CANCELLED_AND_REJECTED:
          (rawCounts["CANCELLED"] ?? 0) + (rawCounts["REJECTED"] ?? 0),
      };

      const formattedOrders = orders.map((order) =>
        formatOrderResponse(order, customerId),
      );

      logger.info(`Fetched orders for customer: ${customerId}`);
      return {
        orders: formattedOrders,
        statusCounts,
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
  static async getCustomerOrderById(orderId: string, customerId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          customerId,
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
      });

      if (!order) {
        throw new Error("Order not found or access denied");
      }

      return {
        ...order,
        packsList: (order.items as unknown as PackGroup[]) || [],
      };
    } catch (error) {
      logger.error(`Error fetching customer order ${orderId}:`, error);
      throw error;
    }
  }

  static async updateProfile(customerId: string, data: any) {
    try {
      const updatedCustomer = await prisma.$transaction(async (tx) => {
        let receiveMarketingEmailsValue: boolean | undefined = undefined;
        if (data.receiveMarketingEmails !== undefined) {
          receiveMarketingEmailsValue =
            data.receiveMarketingEmails === true ||
            data.receiveMarketingEmails === "true";
        }

        const customer = await tx.customer.update({
          where: { id: customerId },
          data: {
            firstName: data.firstName || undefined,
            lastName: data.lastName || undefined,
            phone: data.phone || undefined,
            gender: data.gender || undefined,
            birthday: data.birthday ? new Date(data.birthday) : undefined,
            country: data.country || undefined,
            receiveMarketingEmails: receiveMarketingEmailsValue,
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
            gender: true,
            country: true,
            birthday: true,
            email: true,
            phone: true,
            profilePhotoUrl: true,
            receiveMarketingEmails: true,
            currentLocation: true,
          },
        });

        if (data.currentLocation) {
          await tx.locationHistory.create({
            data: {
              customerId: customer.id,
              location: {
                latitude: data.currentLocation.latitude,
                longitude: data.currentLocation.longitude,
                locationName: data.currentLocation.locationName,
                tag: data.currentLocation.tag,
                fullAddress: data.currentLocation.fullAddress,
                placeId: data.currentLocation.placeId,
                shortAddress: data.currentLocation.shortAddress,
              },
            },
          });
        }

        return customer;
      });

      logger.info(
        `Customer profile and location history updated: ${customerId}`,
      );
      return updatedCustomer;
    } catch (error) {
      logger.error("Error updating customer profile:", error);
      throw error;
    }
  }

  static async getLocationHistory(
    customerId: string,
    limit: number = 20,
    page: number = 1,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [history, total] = await Promise.all([
        prisma.locationHistory.findMany({
          where: { customerId },
          orderBy: { capturedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.locationHistory.count({
          where: { customerId },
        }),
      ]);

      logger.info(`Fetched location history for customer: ${customerId}`);
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
      logger.error("Error fetching customer location history:", error);
      throw error;
    }
  }

  static async saveLocation(customerId: string, data: Point) {
    try {
      const baseName = data.locationName || "Other";

      const existingLocations = await prisma.savedLocation.findMany({
        where: {
          customerId,
          name: { startsWith: baseName },
        },
        select: { name: true },
      });

      let locationName = baseName;
      if (existingLocations.length > 0) {
        locationName = `${baseName} ${existingLocations.length + 1}`;
      }

      const locationPayload = {
        latitude: data.latitude,
        longitude: data.longitude,
        locationName,
        fullAddress: data.fullAddress,
        shortAddress: data.shortAddress,
        placeId: data.placeId,
        tag: data.tag || baseName.toLowerCase(),
      };

      const savedLocation = await prisma.savedLocation.create({
        data: {
          customerId,
          name: locationName,
          location: locationPayload,
          address: data.fullAddress,
        },
      });

      return savedLocation;
    } catch (error) {
      throw error;
    }
  }
  static async getSavedLocations(
    customerId: string,
    limit: number = 20,
    page: number = 1,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [locations, total] = await Promise.all([
        prisma.savedLocation.findMany({
          where: { customerId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.savedLocation.count({
          where: { customerId },
        }),
      ]);

      logger.info(`Fetched saved locations for customer: ${customerId}`);
      return {
        locations,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching saved locations:", error);
      throw error;
    }
  }

  static async deleteSavedLocation(customerId: string, locationId: string) {
    try {
      await prisma.savedLocation.delete({
        where: {
          id: locationId,
          customerId,
        },
      });

      logger.info(
        `Deleted saved location ${locationId} for customer: ${customerId}`,
      );
      return { success: true };
    } catch (error) {
      logger.error("Error deleting saved location:", error);
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
