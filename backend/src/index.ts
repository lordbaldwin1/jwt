import express, { json } from "express";
import { config } from "./config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { middlewareErrorHandler, middlewareLogResponses } from "./api/middleware";
import { handlerGetUser, handlerLogin, handlerRefreshJWT, handlerRevokeRefreshToken, handlerUsersCreate } from "./api/auth";

const app = express();
const PORT = config.port;
app.use(json());
app.use(
  cors({
    origin: config.clientURL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(middlewareLogResponses);

app.post("/api/users/create", (req, res, next) => {
  Promise.resolve(handlerUsersCreate(req, res).catch(next));
});
app.post("/api/users/login", (req, res, next) => {
  Promise.resolve(handlerLogin(req, res).catch(next));
});
app.get("/api/users/auth", (req, res, next) => {
  Promise.resolve(handlerGetUser(req, res).catch(next));
});
app.post("/api/users/refresh", (req, res, next) => {
  Promise.resolve(handlerRefreshJWT(req, res).catch(next));
});
app.post("/api/users/logout", (req, res, next) => {
  Promise.resolve(handlerRevokeRefreshToken(req, res).catch(next));
});

app.use(middlewareErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});