import express from "express";
import { userController } from "../controllers/userController.js";
import rateLimitMiddleware from "../middlewares/rateLimitMiddleware.js";
const Router = express.Router();

// Router.use(rateLimitMiddleware({ capacity: 20, refillRate: 1 }));

Router.post("/login", userController.login);
Router.post("/register", userController.register);

export const authRoute = Router;
