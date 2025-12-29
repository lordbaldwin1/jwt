import { describe, it, expect, beforeAll } from "vitest";
import { checkPasswordHash, hashPassword, signJWT, verifyJWT } from "../api/auth/auth-helpers.js";

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });

  it("should return false for an incorrect password", async () => {
    const result = await checkPasswordHash("wrongPassword", hash1);
    expect(result).toBe(false);
  });

  it("should return false when password doesn't match a different hash", async () => {
    const result = await checkPasswordHash(password1, hash2);
    expect(result).toBe(false);
  });

  it("should return false for an empty password", async () => {
    const result = await checkPasswordHash("", hash1);
    expect(result).toBe(false);
  });

  it("should return false for an invalid hash", async () => {
    const result = await checkPasswordHash(password1, "invalidhash");
    expect(result).toBe(false);
  });
});

describe("JWT Creation and Validation", () => {
  const secret = "abc123";

  const userID1 = "fartstinky";
  const userID2 = "123abc456";

  let jwt1: string;
  let jwt2: string;
  let jwt3: string;
  beforeAll(async () => {
    jwt1 = signJWT(userID1, secret, 10);
    jwt2 = signJWT(userID2, secret, 10);
    jwt3 = signJWT(userID2, secret, 0);
  });

  it("should return correct userID for jwt+secret", () => {
    const result = verifyJWT(jwt1, secret);
    expect(result).toBe(userID1);
  });

  it("should throw for incorrect secret", () => {
    expect(() => verifyJWT(jwt1, secret + "a")).toThrow();
  });

  it("should return correct userID2 for jwt+secret", () => {
    const result = verifyJWT(jwt2, secret);
    expect(result).toBe(userID2);
  });

  it("should throw for expired tokens", () => {
    setTimeout(() => {
      expect(() => verifyJWT(jwt3, secret)).toThrow();
    }, 100);
  });
});