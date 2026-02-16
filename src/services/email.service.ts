import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: "Your One-Time Password",
    html: `
      <h2>Your OTP</h2>
      <p>Your one-time password is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: "Welcome to Anora Admin",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been successfully created.</p>
      <p>You can now log in with your credentials.</p>
    `,
  });
};

export const sendResetEmail = async (
  email: string,
  resetLink: string,
): Promise<boolean> => {
  return sendEmail({
    to: email,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  token: string,
): Promise<boolean> => {
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Reset Your Password - Anora Admin",
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <a href="${resetLink}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
      ">Reset Password</a>
      <p style="color: #666;">Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;"><code>${resetLink}</code></p>
      <p style="color: #999; font-size: 12px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
    `,
  });
};
