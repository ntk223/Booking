import { userRepo } from "../repositories/userRepo.js";

class UserService {
    async createUser(userData) {
        return await userRepo.createUser(userData);
    }
    async getAllUsers() {
        return await userRepo.getAllUsers();
    }
    async deleteUser(userId) {
        return await userRepo.deleteUser(userId);
    }
    async updateUser(userId, updatedData) {
        return await userRepo.updateUser(userId, updatedData);
    }
    async login(email, password) {
        return await userRepo.login(email, password);
    }
    
}

export const userService = new UserService();
