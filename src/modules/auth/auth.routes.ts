import { Router } from "express";
import { register } from "./auth.controller.js";
import { registerSchema } from "./auth.schema.js";
import { validateBody } from "../../middleware/validate.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
