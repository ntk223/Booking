import { userService } from "../services/userService.js";
import { StatusCodes } from "http-status-codes";
class UserController {
    async createUser(req, res) {
        try {
            const userData = req.body;
            const newUser = await userService.createUser(userData);
            res.status(StatusCodes.CREATED).json(newUser);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error", error: error.message });
        }
    }
    async getAllUsers(req, res) {
        try {
            const users = await userService.getAllUsers();
            res.status(StatusCodes.OK).json(users);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error", error: error.message });
        }
    }
    async deleteUser(req, res) {
        try {
            const userId = req.params.id;
            await userService.deleteUser(userId);
            res.status(StatusCodes.NO_CONTENT).send();
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error", error: error.message });
        }
    }
    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const updatedData = req.body;
            const updatedUser = await userService.updateUser(userId, updatedData);
            res.status(StatusCodes.OK).json(updatedUser);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error", error: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await userService.login(email, password);
            if (user) {
                res.status(StatusCodes.OK).json({ message: "Login successful", user });
            } else {
                res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid email or password" });
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error", error: error.message });
        }
    }

    async register(req, res) {
        try {
            const user = await userService.createUser(req.body);
            res.status(StatusCodes.CREATED).json({ message: "User registered successfully", user });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error", error: error.message });
        }
    }
};

export const userController = new UserController();
