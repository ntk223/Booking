import {User} from "../models/Model.js";

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
            throw new Error("User not found.");
        }

        const isPasswordValid = user.password === password; // In real applications, use hashed passwords
        if (!isPasswordValid) {
            throw new Error("Invalid password.");
        }
        return user;
    }
}

export const userRepo = new UserRepository();