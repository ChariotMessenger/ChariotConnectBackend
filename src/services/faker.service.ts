import { PrismaClient, OnlineStatus, VerificationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export class DevSeederService {
  private static generateRandomString(length: number) {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private static async hashPassword() {
    return await bcrypt.hash("password123", 10);
  }

  static async createMockCustomer() {
    const id = this.generateRandomString(5);
    const password = await this.hashPassword();
    return await prisma.customer.create({
      data: {
        firstName: this.getRandomElement([
          "Samuel",
          "John",
          "Jane",
          "Blessing",
        ]),
        lastName: this.getRandomElement([
          "Okonkwo",
          "Abiola",
          "Smith",
          "Adeyemi",
        ]),
        email: `customer_${id}@test.com`,
        phone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
        birthday: new Date("1995-05-15"),
        gender: this.getRandomElement(["Male", "Female"]),
        country: "Nigeria",
        currency: "NGN",
        password,
        isEmailVerified: true,
        currentLocation: {
          latitude: 6.5244,
          longitude: 3.3792,
          locationName: "Lagos, Nigeria",
        },
      },
    });
  }

  static async createMockVendor() {
    const id = this.generateRandomString(5);
    const password = await this.hashPassword();
    return await prisma.vendor.create({
      data: {
        firstName: this.getRandomElement(["Nzubechi", "Alice", "David"]),
        lastName: this.getRandomElement(["Chukwu", "Musa", "Ibrahim"]),
        email: `vendor_${id}@test.com`,
        phone: `090${Math.floor(10000000 + Math.random() * 90000000)}`,
        businessName: `${this.getRandomElement(["Lagos", "Elite", "Urban"])} Kitchen`,
        businessType: this.getRandomElement([
          "Restaurant",
          "Pharmacy",
          "Supermarket",
        ]),
        country: "Nigeria",
        isBusinessRegistered: true,
        isOwner: true,
        password,
        verified: true,
        verificationStatus: VerificationStatus.VERIFIED,
        businessAddress: {
          latitude: 6.4589,
          longitude: 3.6015,
          locationName: "123 Business Way, Ikeja",
        },
      },
    });
  }

  static async createMockRider() {
    const id = this.generateRandomString(5);
    const password = await this.hashPassword();
    return await prisma.rider.create({
      data: {
        firstName: this.getRandomElement(["Tunde", "Emeka", "Uche"]),
        lastName: this.getRandomElement(["Bello", "Eze", "Sani"]),
        email: `rider_${id}@test.com`,
        phone: `070${Math.floor(10000000 + Math.random() * 90000000)}`,
        birthday: new Date("1998-10-20"),
        gender: "Male",
        country: "Nigeria",
        state: "Lagos",
        areaOfWork: "Ikeja",
        currentLocation: {
          latitude: 6.5244,
          longitude: 3.3792,
          locationName: "Lagos, Nigeria",
        },
        drivingLicenseUrl: "https://example.com/license.jpg",
        ninNumber: Math.floor(
          10000000000 + Math.random() * 90000000000,
        ).toString(),
        idCardUrl: "https://example.com/id.jpg",
        bikePlateNumber: `LAG-${id.toUpperCase()}`,
        password,
        guarantorName: "Guarantor Name",
        guarantorRelationship: "Relative",
        guarantorPhone: "08012345678",
        guarantorNin: "12345678901",
        guarantorIdCardUrl: "https://example.com/gid.jpg",
        bankName: "Access Bank",
        accountNumber: "0123456789",
        accountName: "Rider Test Name",
        verifyIdentityUrl: "https://example.com/verify",
        onlineStatus: OnlineStatus.ONLINE,
        verified: true,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });
  }
}
