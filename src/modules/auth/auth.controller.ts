import type { RequestHandler } from "express";
import { registerUser } from "./auth.service.js";
import type { RegisterInput } from "./auth.schema.js";

export const register: RequestHandler = async (req, res) => {
  const result = await registerUser(req.body as RegisterInput);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
};
