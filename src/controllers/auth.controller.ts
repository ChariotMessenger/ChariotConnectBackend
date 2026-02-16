import { Response } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/errorHandler";

export class AuthController {
  async register(req: AuthRequest, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        throw new AppError(400, "Missing required fields");
      }

      const result = await authService.register(
        email,
        password,
        firstName,
        lastName,
      );
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.message.includes("already exists") ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError(400, "Email and password required");
      }

      const result = await authService.login(email, password);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  async verifyOTP(req: AuthRequest, res: Response) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        throw new AppError(400, "Email and OTP required");
      }

      const result = await authService.verifyOTP(email, otp);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError(401, "Not authenticated");
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        throw new AppError(400, "Old and new password required");
      }

      const result = await authService.changePassword(
        req.user.id,
        oldPassword,
        newPassword,
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async forgotPassword(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError(400, "Email is required");
      }

      const result = await authService.forgotPassword(email);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async verifyPasswordResetOTP(req: AuthRequest, res: Response) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        throw new AppError(400, "Email and OTP required");
      }

      const result = await authService.verifyPasswordResetOTP(email, otp);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode =
        error.message.includes("expired") || error.message.includes("Invalid")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  async resetPassword(req: AuthRequest, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        throw new AppError(400, "Email, OTP and new password required");
      }

      const result = await authService.resetPassword(email, otp, newPassword);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode =
        error.message.includes("expired") || error.message.includes("Invalid")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const authController = new AuthController();
