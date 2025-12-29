import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request } from "express";
import { UnauthorizedError } from "../../error";
import { randomBytes } from "node:crypto";

export const ONE_HOUR_IN_SECONDS = 60*60;
export const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
export const FIFTEEN_MINUTES = 15 * 60 * 1000;
const TOKEN_ISSUER = "jwt-auth";
type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function checkPasswordHash(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export function signJWT(userId: string, secret: string, expiresIn = ONE_HOUR_IN_SECONDS) {
  const timeInSeconds = Math.floor(Date.now() / 1000);

  const payload: Payload = {
    iss: TOKEN_ISSUER,
    sub: userId,
    iat: timeInSeconds,
    exp: timeInSeconds + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function verifyJWT(token: string, secret: string) {
  let decoded: Payload;
  try {
    decoded = jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid JWT token");
  }

  if (decoded.iss !== TOKEN_ISSUER) {
    throw new UnauthorizedError("Invalid JWT issuer");
  }

  if (!decoded.sub) {
    throw new UnauthorizedError("User ID not present in JWT");
  }

  return decoded.sub;
}

export function getBearerToken(req: Request) {
  const header = req.get("Authorization");
  if (!header) {
    throw new UnauthorizedError("Malformed request header");
  }
  const splitHeader = header.split(" ");
  return splitHeader[1];
}

export function makeRefreshToken() {
  return randomBytes(32).toString('hex');
}