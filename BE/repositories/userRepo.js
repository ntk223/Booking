import { User } from "../models/Model.js";
import { generateToken } from "../utils/jwt.js";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import { BaseRepository } from "./BaseRepository.js";

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    async createUser(userData) {
        const emailExists = await this.model.findOne({
            where: { email: userData.email },
        });
        if (emailExists) {
            throw new Error("Email already in use.");
        }
        return await this.create(userData);
    }

    async getAllUsers() {
        return await this.findAll();
    }

    async deleteUser(userId) {
        return await this.delete(userId);
    }

    async updateUser(userId, updatedData) {
        return await this.update(userId, updatedData);
    }

    async login(email, password) {
        if (!email || !password) {
            throw new Error("Email and password are required.");
        }

        const user = await this.model.findOne({ where: { email: email } });
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
        }

        const isPasswordValid = user.password === password; // In real applications, use hashed passwords
        if (!isPasswordValid) {
            // console.log(StatusCodes.UNAUTHORIZED);
            throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid password.");
        }
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return { user, token };
    }
}

export { UserRepository };
export const userRepo = new UserRepository();