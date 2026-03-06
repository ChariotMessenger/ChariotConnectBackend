import jwt, { SignOptions } from "jsonwebtoken";
import { logger } from "./logger";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRY = (process.env.JWT_EXPIRY ||
  "7d") as jwt.SignOptions["expiresIn"];
export interface TokenPayload {
  id: string;
  email: string;
  userType: string;
}

export const generateToken = (payload: TokenPayload): string => {
  try {
    const signOptions: SignOptions = {
      expiresIn: JWT_EXPIRY,
    };

    const token = jwt.sign({ ...payload }, JWT_SECRET, signOptions);
    return token;
  } catch (error) {
    logger.error("Error generating token:", error);
    throw error;
  }
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.error("Error verifying token:", error);
    throw error;
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.error("Error decoding token:", error);
    return null;
  }
};
