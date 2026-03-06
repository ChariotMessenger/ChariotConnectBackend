import bcrypt from "bcryptjs";
import logger from "./logger";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    logger.error("Error hashing password:", error);
    throw error;
  }
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error("Error comparing passwords:", error);
    throw error;
  }
};
