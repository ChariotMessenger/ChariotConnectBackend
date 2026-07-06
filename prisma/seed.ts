/// <reference types="node" />
import { PrismaClient, AdminStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@umali.app";
  const plainPassword = "Password@123!";

  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    return;
  }

  let defaultRole = await prisma.role.findFirst();

  if (!defaultRole) {
    defaultRole = await prisma.role.create({
      data: {
        name: "Super Admin",
        permissions: ["MANAGE_VERIFICATIONS", "ALL"],
      } as any,
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  await prisma.admin.create({
    data: {
      name: "System Administrator",
      email,
      password: hashedPassword,
      status: AdminStatus.ACTIVE,
      roleId: defaultRole.id,
    },
  });
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
