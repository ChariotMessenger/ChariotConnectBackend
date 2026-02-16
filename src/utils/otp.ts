import crypto from 'crypto';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateOTPExpiry = (): Date => {
  const expiryMs = parseInt(process.env.OTP_EXPIRE || '300000');
  return new Date(Date.now() + expiryMs);
};

export const verifyOTPExpiry = (expiresAt: Date): boolean => {
  return new Date() <= expiresAt;
};

export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
