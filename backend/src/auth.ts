import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { ONE_HOUR_IN_SECONDS } from "./config";
import type { Request } from "express";
import { UnauthorizedError } from "./api/error";

const TOKEN_ISSUER = "jwt-auth";
type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function checkPasswordHash(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export async function createJWT(userId: string, secret: string, expiresIn = ONE_HOUR_IN_SECONDS) {
  const timeInSeconds = Math.floor(Date.now() / 1000);

  const payload: Payload = {
    iss: TOKEN_ISSUER,
    sub: userId,
    iat: timeInSeconds,
    exp: timeInSeconds + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function getBearerToken(req: Request) {
  const header = req.get("Authorization");
  if (!header) {
    throw new UnauthorizedError("Malformed request header");
  }
  const splitHeader = header.split(" ");
  return splitHeader[1];
}