import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../../lib/password.js";
import { signAccessToken } from "../../lib/jwt.js";
import { AppError } from "../../errors/app-error.js";
import type { RegisterInput } from "./auth.schema.js";

export const registerUser = async (input: RegisterInput) => {
  const email = input.email.trim().toLowerCase();
  const password = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: { name: input.name.trim(), email, password },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      user,
      accessToken: signAccessToken({ sub: user.id, email: user.email }),
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "Email is already registered");
    }

    throw error;
  }
};
