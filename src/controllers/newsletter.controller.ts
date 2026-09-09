import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const subscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const newsletter = await prisma.newsletter.create({
      data: {
        email,
      },
    });

    return res.status(201).json(newsletter);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email is already subscribed" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
