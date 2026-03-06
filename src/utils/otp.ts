import { prisma } from "../config/database";
import { logger } from "./logger";
import { UserRole } from "@prisma/client";

export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const createOTPVerification = async (
  email: string,
  userType: UserRole,
  userId?: string,
) => {
  try {
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const otp = await prisma.oTPVerification.create({
      data: {
        code,
        email,
        userType,
        userId,
        expiresAt,
      },
    });

    logger.info(`OTP created for ${email}`);
    return otp;
  } catch (error) {
    logger.error("Error creating OTP:", error);
    throw error;
  }
};

export const verifyOTP = async (email: string, code: string) => {
  try {
    const otp = await prisma.oTPVerification.findFirst({
      where: {
        email,
        code,
        verified: false,
      },
    });

    if (!otp) {
      return null;
    }

    if (new Date() > otp.expiresAt) {
      return null;
    }

    // Mark as verified
    await prisma.oTPVerification.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    logger.info(`OTP verified for ${email}`);
    return otp;
  } catch (error) {
    logger.error("Error verifying OTP:", error);
    throw error;
  }
};

export const invalidateOTP = async (email: string) => {
  try {
    await prisma.oTPVerification.deleteMany({
      where: { email, verified: false },
    });
    logger.info(`OTP invalidated for ${email}`);
  } catch (error) {
    logger.error("Error invalidating OTP:", error);
    throw error;
  }
};
