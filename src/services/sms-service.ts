import axios from "axios";

export class SmsService {
  private static readonly BREVO_API_URL =
    "https://api.brevo.com/v3/transactionalSMS/send";
  private static readonly API_KEY = process.env.BREVO_API_KEY;

  static async sendSms(params: {
    recipient: string;
    content: string;
    sender: string;
    type?: "transactional" | "marketing";
    tag?: string;
  }) {
    try {
      const {
        recipient,
        content,
        sender,
        type = "transactional",
        tag,
      } = params;

      const response = await axios.post(
        this.BREVO_API_URL,
        {
          sender,
          recipient,
          content,
          type,
          tag,
        },
        {
          headers: {
            accept: "application/json",
            "api-key": this.API_KEY,
            "content-type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("Brevo SMS Error:", error.response?.data || error.message);
      throw error;
    }
  }
}
