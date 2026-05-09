import { logger } from "../utils/logger";

export interface Country {
  countryName: string;
  countryCode: string;
  countryIso: string;
  localCountryCode: number;
}

export class GlobalService {
  private static countries: Country[] = [
    {
      countryName: "Nigeria",
      countryCode: "NG",
      countryIso: "NGA",
      localCountryCode: 234,
    },
    {
      countryName: "United States",
      countryCode: "US",
      countryIso: "USA",
      localCountryCode: 1,
    },
    {
      countryName: "United Kingdom",
      countryCode: "GB",
      countryIso: "GBR",
      localCountryCode: 44,
    },
    {
      countryName: "Ghana",
      countryCode: "GH",
      countryIso: "GHA",
      localCountryCode: 233,
    },
    {
      countryName: "Kenya",
      countryCode: "KE",
      countryIso: "KEN",
      localCountryCode: 254,
    },
    {
      countryName: "South Africa",
      countryCode: "ZA",
      countryIso: "ZAF",
      localCountryCode: 27,
    },
  ];

  static async getCountries() {
    try {
      logger.info("Fetching list of countries");
      return this.countries;
    } catch (error) {
      logger.error("Error fetching country list:", error);
      throw error;
    }
  }

  static async getCountryByIso(iso: string) {
    try {
      const country = this.countries.find(
        (c) => c.countryIso.toLowerCase() === iso.toLowerCase(),
      );
      if (!country) throw new Error("Country not found");
      return country;
    } catch (error) {
      logger.error(`Error fetching country with ISO ${iso}:`, error);
      throw error;
    }
  }
}
