import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRateLimiter } from "./middleware/rate-limit.js";
import { authRouter } from "./modules/auth/auth.routes.js";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());

// Rate limit auth requests before body parsing so malformed and oversized
// bodies still count toward the limit.
app.use("/api/v1/auth", authRateLimiter);
app.use(express.json());

const allowedOrigins =
  env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

if (allowedOrigins.length > 0) {
  app.use(cors({ origin: allowedOrigins }));
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "todo-api",
  });
});

app.use("/api/v1/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);
