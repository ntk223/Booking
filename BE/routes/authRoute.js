import express from "express";
import { UserController } from "../controllers/userController.js";
import { UserService } from "../services/userService.js";
import { userRepo } from "../repositories/userRepo.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { loginSchema, createUserSchema } from "../validations/userValidation.js";
import rateLimitMiddleware from "../middlewares/rateLimitMiddleware.js";

// Dependency Injection
const myUserService = new UserService(userRepo);
const myUserController = new UserController(myUserService);

const Router = express.Router();

Router.use(rateLimitMiddleware({ capacity: 10, refillRate: 0.5 }));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
Router.post("/login", validate(loginSchema), myUserController.login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
Router.post("/register", validate(createUserSchema), myUserController.createUser);

export const authRoute = Router;
