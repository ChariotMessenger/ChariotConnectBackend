import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { generateToken } from "../utils/jwt";
import { generateOTP, generateOTPExpiry, verifyOTPExpiry } from "../utils/otp";
import {
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from "./email.service";
import { ROLE_PERMISSIONS } from "../types";

export class AuthService {
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcryptjs.hash(password, 12);
    const permissions = ROLE_PERMISSIONS.STAFF;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "STAFF",
        permissions,
      },
    });

    await sendWelcomeEmail(email, firstName);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    return { user: this.sanitizeUser(user), token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid credentials");

    if (user.twoFactorEnabled) {
      const otp = generateOTP();
      const expiresAt = generateOTPExpiry();

      await prisma.oTPVerification.create({
        data: {
          email,
          otp,
          expiresAt,
        },
      });

      await sendOTPEmail(email, otp);
      return { requiresOTP: true, email };
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    return { user: this.sanitizeUser(user), token };
  }

  async verifyOTP(email: string, otp: string) {
    const otpRecord = await prisma.oTPVerification.findFirst({
      where: { email, otp },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) throw new Error("Invalid OTP");
    if (!verifyOTPExpiry(otpRecord.expiresAt)) throw new Error("OTP expired");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    return { user: this.sanitizeUser(user), token };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const isPasswordValid = await bcryptjs.compare(oldPassword, user.password);
    if (!isPasswordValid) throw new Error("Old password is incorrect");

    const hashedPassword = await bcryptjs.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Password changed successfully" };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    const otp = generateOTP();
    const expiresAt = generateOTPExpiry();

    await prisma.passwordResetOTP.create({
      data: {
        email,
        otp,
        expiresAt,
      },
    });

    await sendOTPEmail(email, otp);

    return { message: "6-digit verification code sent to email" };
  }

  async verifyPasswordResetOTP(email: string, otp: string) {
    const otpRecord = await prisma.passwordResetOTP.findFirst({
      where: { email, otp, used: false },
    });

    if (!otpRecord) throw new Error("Invalid OTP");
    if (new Date() > otpRecord.expiresAt) throw new Error("OTP expired");

    return { message: "OTP verified", otpId: otpRecord.id };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    const otpRecord = await prisma.passwordResetOTP.findFirst({
      where: { email, otp, used: false },
    });

    if (!otpRecord) throw new Error("Invalid OTP");
    if (new Date() > otpRecord.expiresAt) throw new Error("OTP expired");

    const hashedPassword = await bcryptjs.hash(newPassword, 12);

    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetOTP.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
    ]);

    return { message: "Password reset successfully" };
  }

  private sanitizeUser(user: any) {
    const { password, totpSecret, ...rest } = user;
    return rest;
  }
}

export const authService = new AuthService();
