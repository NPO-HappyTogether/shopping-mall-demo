import { Router } from "express";
import * as authController from "../controllers/authController.js";
import {
  authenticateJwt,
  loadUser,
  requireSession,
} from "../middleware/authenticate.js";

export const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/session", authController.sessionStatus);
authRouter.get(
  "/me",
  authenticateJwt,
  loadUser,
  authController.me
);
authRouter.get("/me/session", requireSession, (req, res, next) => {
  req.userId = req.session.userId;
  next();
}, loadUser, authController.me);
