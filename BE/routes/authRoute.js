import express from "express";
import { userController } from "../controllers/userController.js";

const Router = express.Router();

Router.post("/login", userController.login);
Router.post("/register", userController.register);

export const authRoute = Router;
