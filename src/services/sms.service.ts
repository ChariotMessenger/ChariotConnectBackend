import axios from "axios";
import { logger } from "../utils/logger";

const TERMII_BASE_URL = "https://api.ng.termii.com/api";
const TERMII_API_KEY = process.env.TERMII_API_KEY;

export class SMSService {
  static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const formattedNumber = to.startsWith("+") ? to.substring(1) : to;

      await axios.post(`${TERMII_BASE_URL}/sms/send`, {
        api_key: TERMII_API_KEY,
        to: formattedNumber,
        from: "Chariot",
        sms: message,
        type: "plain",
        channel: "generic",
      });

      logger.info(`SMS sent to ${to}`);
      return true;
    } catch (error) {
      logger.error("Error sending SMS:", error);
      return false;
    }
  }

  static async sendOTP(to: string, otp: string): Promise<boolean> {
    try {
      const formattedNumber = to.startsWith("+") ? to.substring(1) : to;

      await axios.post(`${TERMII_BASE_URL}/sms/otp/send`, {
        api_key: TERMII_API_KEY,
        to: formattedNumber,
        from: "Chariot",
        message_type: "ALPHANUMERIC",
        message_text: `Your Chariot Connect code is ${otp}. Valid for 15 minutes.`,
        channel: "dnd",
        pin_attempts: 3,
        pin_time_to_live: 15,
        pin_length: 6,
      });

      logger.info(`OTP SMS sent to ${to}`);
      return true;
    } catch (error) {
      logger.error("Error sending OTP SMS:", error);
      return false;
    }
  }

  static async sendOrderUpdate(
    to: string,
    orderId: string,
    status: string,
  ): Promise<boolean> {
    const message = `Chariot Connect: Order #${orderId} is now ${status}. Check your app for details.`;
    return this.sendSMS(to, message);
  }
}

export default SMSService;
