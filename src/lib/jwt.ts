import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

type AccessTokenPayload = {
  sub: string;
  email: string;
};

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
