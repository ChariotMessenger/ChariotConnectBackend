import axios from "axios";

const countryToCurrency: Record<string, string> = {
  NG: "NGN",
  GH: "GHS",
  KE: "KES",
  ZA: "ZAR",
  UG: "UGX",
  RW: "RWF",
};

export const getCurrencyByIP = async (ip: string): Promise<string> => {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    const countryCode = response.data.country_code; // e.g., "NG"
    return countryToCurrency[countryCode] || "USD";
  } catch (error) {
    return "USD";
  }
};
