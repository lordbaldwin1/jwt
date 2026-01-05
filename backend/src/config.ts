import "dotenv/config";
import { ONE_HOUR_IN_SECONDS } from "./api/auth/auth-helpers";

type Config = {
  baseURL: string;
  port: string;
  platform: string;
  databaseURL: string;
  jwtDefaultDuration: number;
  jwtSecret: string;
  clientURL: string;
}

function envOrThrow(key: string) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`${key} must be defined in .env`);
  }
  return val;
}

export const config: Config = {
  baseURL: envOrThrow("BASE_URL"),
  port: envOrThrow("PORT"),
  platform: envOrThrow("PLATFORM"),
  databaseURL: envOrThrow("DATABASE_URL"),
  jwtDefaultDuration: ONE_HOUR_IN_SECONDS,
  jwtSecret: envOrThrow("JWT_SECRET"),
  clientURL: envOrThrow("CLIENT_URL"),
}