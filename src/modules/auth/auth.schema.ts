import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email is required")
    .max(254, "Email must be at most 254 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/\p{L}/u, "Password must contain at least one letter")
    .regex(/\p{N}/u, "Password must contain at least one number"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
