import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  // port: parseInt(process.env.SMTP_PORT || "587"),
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export class EmailService {
  static async sendOTPEmail(
    email: string,
    otp: string,
    userName?: string,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        // from: process.env.SMTP_EMAIL,
        from: `"Chariot Connect" Chukwumasamuel371@gmail.com`,
        to: email,
        subject: "Your Chariot Connect Verification Code",
        html: `
          <h2>Verification Code</h2>
          <p>Hello ${userName || "User"},</p>
          <p>Your verification code is:</p>
          <h1 style="color: #007AFF; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 15 minutes.</p>
          <p>Do not share this code with anyone.</p>
          <hr />
          <p>If you did not request this code, please ignore this email.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`OTP email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error("Error sending OTP email:", error);
      throw error;
    }
  }

  static async sendWelcomeEmail(
    email: string,
    userName: string,
    userType: string,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        // from: process.env.SMTP_EMAIL,
        from: `"Chariot Connect" Chukwumasamuel371@gmail.com`,
        to: email,
        subject: "Welcome to Chariot Connect!",
        html: `
          <h2>Welcome to Chariot Connect</h2>
          <p>Hello ${userName},</p>
          <p>Your account as a <strong>${userType}</strong> has been successfully created.</p>
          <p>You can now start using Chariot Connect to:</p>
          <ul>
            <li>Connect with vendors and riders</li>
            <li>Browse services and products</li>
            <li>Send real-time messages</li>
            <li>Leave and read reviews</li>
          </ul>
          <p>Visit our app to get started!</p>
          <hr />
          <p>If you have any questions, please contact our support team.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error("Error sending welcome email:", error);
      throw error;
    }
  }

  static async sendVerificationStatusEmail(
    email: string,
    userName: string,
    status: "VERIFIED" | "REJECTED",
    reason?: string,
  ): Promise<boolean> {
    try {
      const subject =
        status === "VERIFIED"
          ? "Your Account Has Been Verified"
          : "Account Verification Failed";

      const statusMessage =
        status === "VERIFIED"
          ? "Congratulations! Your account has been verified and is now active."
          : `Your account verification failed. Reason: ${reason || "Document verification failed"}`;

      const mailOptions = {
        // from: process.env.SMTP_EMAIL,
        from: `"Chariot Connect" Chukwumasamuel371@gmail.com`,
        to: email,
        subject,
        html: `
          <h2>${subject}</h2>
          <p>Hello ${userName},</p>
          <p>${statusMessage}</p>
          ${status === "REJECTED" ? "<p>Please contact our support team for more information.</p>" : ""}
          <hr />
          <p>Chariot Connect Support Team</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Verification status email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error("Error sending verification status email:", error);
      throw error;
    }
  }

  static async sendOrderNotificationEmail(
    email: string,
    orderDetails: any,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        // from: process.env.SMTP_EMAIL,
        from: `"Chariot Connect" Chukwumasamuel371@gmail.com`,
        to: email,
        subject: "New Order Notification",
        html: `
          <h2>New Order</h2>
          <p>Order ID: ${orderDetails.orderId}</p>
          <p>Amount: ${orderDetails.amount}</p>
          <p>Status: ${orderDetails.status}</p>
          <hr />
          <p>Check your app for more details.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Order notification email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error("Error sending order notification email:", error);
      throw error;
    }
  }

  static async testEmailConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      logger.info("Email connection verified");
      return true;
    } catch (error) {
      logger.error("Email connection failed:", error);
      throw error;
    }
  }
}

export default EmailService;
