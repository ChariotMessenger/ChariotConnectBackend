import { PrismaClient, AdminStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

export class AdminService {
  async createRole(data: {
    title: string;
    description?: string;
    permissions: string[];
  }) {
    return await prisma.role.create({
      data: {
        title: data.title,
        description: data.description,
        permissions: data.permissions,
      },
    });
  }

  async createAdmin(data: { name: string; email: string; roleId: string }) {
    const tempPassword = crypto.randomBytes(4).toString("hex").toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const admin = await prisma.admin.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        roleId: data.roleId,
      },
      include: { role: true },
    });

    return { admin, tempPassword };
  }

  async getAllAdmins(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: AdminStatus;
    roleId?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        query.search
          ? {
              OR: [
                {
                  name: { contains: query.search, mode: "insensitive" as any },
                },
                {
                  email: { contains: query.search, mode: "insensitive" as any },
                },
              ],
            }
          : {},
        query.status ? { status: query.status } : {},
        query.roleId ? { roleId: query.roleId } : {},
      ],
    };

    const [total, admins] = await prisma.$transaction([
      prisma.admin.count({ where }),
      prisma.admin.findMany({
        where,
        skip,
        take: limit,
        include: { role: { select: { title: true, permissions: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data: admins,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllRoles(query: { page?: number; limit?: number; search?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" as any } },
            {
              description: {
                contains: query.search,
                mode: "insensitive" as any,
              },
            },
          ],
        }
      : {};

    const [total, roles] = await prisma.$transaction([
      prisma.role.count({ where }),
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: "asc" },
      }),
    ]);

    return {
      data: roles,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateRole(
    id: string,
    data: {
      title?: string;
      description?: string;
      permissions?: string[];
    },
  ) {
    return await prisma.role.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.permissions && { permissions: data.permissions }),
      },
    });
  }

  async updateAdmin(
    id: string,
    data: {
      name?: string;
      roleId?: string;
      status?: AdminStatus;
    },
  ) {
    return await prisma.admin.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.roleId && { roleId: data.roleId }),
        ...(data.status && { status: data.status }),
      },
      include: { role: true },
    });
  }
}
