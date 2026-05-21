import { Router } from "express";
import * as usersController from "../controllers/usersController.js";
import { authenticateJwt, loadUser } from "../middleware/authenticate.js";

export const usersRouter = Router();

usersRouter.get("/", usersController.listUsers);
usersRouter.get(
  "/me",
  authenticateJwt,
  loadUser,
  usersController.getCurrentUser
);
usersRouter.get("/:id", usersController.getUserById);
usersRouter.post("/", usersController.createUser);
usersRouter.patch("/:id", usersController.updateUser);
usersRouter.delete("/:id", usersController.deleteUser);
