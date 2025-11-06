import express from "express";
import { userController } from "../controllers/userController.js";
const Router = express.Router();

Router.post("/", userController.createUser);
Router.get("/", userController.getAllUsers);
Router.delete("/:id", userController.deleteUser);
Router.put("/:id", userController.updateUser);
export const userRoute = Router;
