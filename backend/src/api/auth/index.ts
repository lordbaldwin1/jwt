import type { Request, Response } from "express";
import {
  insertUser,
  selectUserByEmail,
  selectUserByID,
  updateUserCredentials,
} from "../../db/queries/users.js"
import { BadRequestError, UnauthorizedError } from "../../error.js";
import type { User } from "../../db/schema.js";
import {
  checkPasswordHash,
  getBearerToken,
  hashPassword,
  signJWT,
  makeRefreshToken,
  verifyJWT,
  SEVEN_DAYS,
} from "./auth-helpers.js";
import { config } from "../../config.js";
import { getUserByRefreshToken, revokeRefreshToken, saveRefreshToken } from "../../db/queries/refresh-tokens"

type UserResponse = Omit<User, "hashedPassword">;

export async function handlerUsersCreate(req: Request, res: Response) {
  type Parameters = {
    email: string;
    password: string;
  };

  const params: Parameters = req.body;
  if (!params.email || !params.password) {
    throw new BadRequestError("Missing required fields");
  }

  if (params.password.length < 8) {
    throw new BadRequestError("Your password must be at least 8 characters in length");
  }

  params.password = await hashPassword(params.password);
  const user = await insertUser({
    email: params.email,
    hashedPassword: params.password,
  });
  if (!user) {
    throw new Error("Could not create user, does this user already exist?");
  }

  res.status(201).send(user);
}

export async function handlerLogin(req: Request, res: Response) {
  type Parameters = {
    email: string;
    password: string;
  };

  const params: Parameters = req.body;
  if (!params.email || !params.password) {
    throw new BadRequestError("Missing required fields");
  }

  const user = await selectUserByEmail(params.email);
  if (!user) {
    throw new UnauthorizedError("Incorrect email or password");
  }

  if (
    (await checkPasswordHash(params.password, user.hashedPassword)) === false
  ) {
    throw new UnauthorizedError("Incorrect email or password");
  }

  const token = signJWT(user.id, config.jwtSecret);
  const refreshToken = makeRefreshToken();
  const dbRefreshToken = await saveRefreshToken(user.id, refreshToken);
  if (!dbRefreshToken) {
    throw new UnauthorizedError("No refresh token");
  }

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.platform === "production",
    sameSite: "strict",
    maxAge: SEVEN_DAYS,
  });
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: config.platform === "production",
    sameSite: "strict",
    maxAge: config.jwtDefaultDuration,
  })

  res.header("Content-Type", "application/json");
  const response: UserResponse = {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
  };
  res.status(200).send(response);
}

export async function handlerRefreshJWT(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new BadRequestError("Your session has expired, please login again");
  }

  const result = await getUserByRefreshToken(refreshToken);
  if (!result?.user) {
    res.clearCookie("refreshToken");
    throw new UnauthorizedError("User not found");
  }

  const user = result.user;
  const newAccessToken = signJWT(user.id, config.jwtSecret, config.jwtDefaultDuration);
  res.set("Content-Type", "application/json");
  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: config.platform === "production",
    sameSite: "strict",
    maxAge: config.jwtDefaultDuration,
  })
  res.status(200).end();
}

export async function handlerRevokeRefreshToken(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new BadRequestError("No refresh token to revoke");
  }
  await revokeRefreshToken(refreshToken);

  res.clearCookie("refreshToken");

  res.clearCookie("accessToken")
  res.status(204).send();
}

export async function handlerUpdateCredentials(req: Request, res: Response) {
  type Parameters = {
    password: string,
    email: string,
  }
  const token = getBearerToken(req);
  if (!token) {
    throw new BadRequestError("Bearer token missing");
  }
  const userID = verifyJWT(token, config.jwtSecret);

  const params: Parameters = req.body;

  if (!params.email || !params.password) {
    throw new BadRequestError("Missing required fields");
  }
  const hashedPassword = await hashPassword(params.password);
  const updatedUser = await updateUserCredentials(userID, params.email, hashedPassword);
  if (!updatedUser) {
    throw new Error("Failed to update user");
  }

  const body: UserResponse = {
    id: updatedUser.id,
    email: updatedUser.email,
    updatedAt: updatedUser.updatedAt,
    createdAt: updatedUser.createdAt,
  }
  res.status(200).send(body);
}

export async function handlerGetUser(req: Request, res: Response) {
  const token = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!token && !refreshToken) {
    res.status(200).json(null);
    return;
  }

  const userID = verifyJWT(token, config.jwtSecret);
  if (!userID) {
    throw new UnauthorizedError("Invalid JWT");
  }

  const user = await selectUserByID(userID);
  if (!user) {
    console.log("here");
    throw new Error("User does not exist");
  }

  const body: UserResponse = {
    id: userID,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
  }
  res.status(200).send(body);
}