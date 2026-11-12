import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

const clientErrorMessages: Record<number, string> = {
  413: "Request body too large",
  415: "Unsupported content type or encoding",
};

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
    });
    return;
  }

  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    res.status(400).json({ success: false, message: "Invalid JSON body" });
    return;
  }

  const status = "status" in error && typeof error.status === "number" ? error.status : null;

  if (status !== null && status >= 400 && status < 500) {
    res
      .status(status)
      .json({ success: false, message: clientErrorMessages[status] ?? "Invalid request" });
    return;
  }

  console.error(error instanceof Error ? error.stack : error);
  res.status(500).json({ success: false, message: "Internal server error" });
};
