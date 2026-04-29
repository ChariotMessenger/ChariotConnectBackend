import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});
export class EmailService {
  private static async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    try {
      const info = await transporter.sendMail({
        from: `"${process.env.SMTP_SENDER_NAME}" <${process.env.GOOGLE_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error("Gmail API sending error:", error);
      return false;
    }
  }

  static async sendOTPEmail(
    email: string,
    otp: string,
    userName?: string,
  ): Promise<boolean> {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Verification Code</h2>
          <p>Hello ${userName || "User"},</p>
          <p>Your verification code is:</p>
          <h1 style="color: #007AFF; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 15 minutes.</p>
          <p>Do not share this code with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">If you did not request this code, please ignore this email.</p>
        </div>
      `;
    return this.send({
      to: email,
      subject: "Your Chariot Connect Verification Code",
      html,
    });
  }

  static async sendWelcomeEmail(
    email: string,
    userName: string,
    userType: string,
  ): Promise<boolean> {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Welcome to Chariot Connect</h2>
          <p>Hello ${userName},</p>
          <p>Your account as a <strong>${userType}</strong> has been successfully created.</p>
          <ul>
            <li>Connect with vendors and riders</li>
            <li>Browse services and products</li>
            <li>Send real-time messages</li>
            <li>Leave and read reviews</li>
          </ul>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p>Visit our app to get started!</p>
        </div>
      `;
    return this.send({
      to: email,
      subject: "Welcome to Chariot Connect!",
      html,
    });
  }

  static async sendVerificationStatusEmail(
    email: string,
    userName: string,
    status: "VERIFIED" | "REJECTED",
    reason?: string,
  ): Promise<boolean> {
    const subject =
      status === "VERIFIED"
        ? "Your Account Has Been Verified"
        : "Account Verification Failed";
    const statusMessage =
      status === "VERIFIED"
        ? "Congratulations! Your account has been verified."
        : `Your account verification failed. Reason: ${reason || "Document verification failed"}`;

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>${subject}</h2>
          <p>Hello ${userName},</p>
          <p>${statusMessage}</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">Chariot Connect Support Team</p>
        </div>
      `;
    return this.send({ to: email, subject, html });
  }

  static async sendOrderNotificationEmail(
    email: string,
    orderDetails: any,
  ): Promise<boolean> {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>New Order</h2>
          <p>Order ID: ${orderDetails.orderId}</p>
          <p>Amount: ${orderDetails.amount}</p>
          <p>Status: ${orderDetails.status}</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p>Check your app for more details.</p>
        </div>
      `;
    return this.send({ to: email, subject: "New Order Notification", html });
  }

  static async testEmailConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      return true;
    } catch (error) {
      logger.error("Gmail API connection check failed:", error);
      return false;
    }
  }
}

export default EmailService;
