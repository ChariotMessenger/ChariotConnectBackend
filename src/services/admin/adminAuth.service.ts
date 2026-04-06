import { PrismaClient, AdminStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CustomError } from "../../middlewares/errorHandler";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export class AdminAuthService {
  async login(data: { email: string; password: string }) {
    const admin = await prisma.admin.findUnique({
      where: { email: data.email },
      include: { role: true },
    });

    if (!admin) {
      throw new CustomError("Invalid credentials", 401, "AUTH_FAILED");
    }

    if (admin.status !== "ACTIVE") {
      throw new CustomError(
        `Account is ${admin.status.toLowerCase()}`,
        403,
        "ACCOUNT_RESTRICTED",
      );
    }

    const isPasswordValid = await bcrypt.compare(data.password, admin.password);
    if (!isPasswordValid) {
      throw new CustomError("Invalid credentials", 401, "AUTH_FAILED");
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        userType: "ADMIN",
        role: admin.role.title,
        permissions: admin.role.permissions,
      },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    const { password, ...adminData } = admin;
    return { admin: adminData, token };
  }

  async updatePassword(
    adminId: string,
    data: { current: string; new: string },
  ) {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new CustomError("Admin not found", 404);

    const isValid = await bcrypt.compare(data.current, admin.password);
    if (!isValid) throw new CustomError("Current password incorrect", 400);

    const hashedPassword = await bcrypt.hash(data.new, 10);
    return await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });
  }

  async getProfile(adminId: string) {
    return await prisma.admin.findUnique({
      where: { id: adminId },
      include: { role: true },
    });
  }
}
