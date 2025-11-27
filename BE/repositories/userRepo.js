import {User} from "../models/Model.js";
import { generateToken } from "../utils/jwt.js";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
class UserRepository {
    async createUser(userData) {
        const emailExists = await User.findOne({ where: { email: userData.email } });
        if (emailExists) {
            throw new Error("Email already in use.");
        }
        return await User.create(userData);
    }

    async getAllUsers() {
        return await User.findAll();
    }

    async deleteUser(userId) {
        return await User.destroy({ where: { id: userId } });
    }

    async updateUser(userId, updatedData) {
        return await User.update(updatedData, { where: { id: userId } });
    }

    async login(email, password) {
        if (!email || !password) {
            throw new Error("Email and password are required.");
        }

        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
        }

        const isPasswordValid = user.password === password; // In real applications, use hashed passwords
        if (!isPasswordValid) {
            // console.log(StatusCodes.UNAUTHORIZED);
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid password.");
        }
        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        return { user, token };
    }
}

export const userRepo = new UserRepository();