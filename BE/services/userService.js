

class UserService {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }

    async createUser(userData) {
        return await this.userRepo.createUser(userData);
    }

    async getAllUsers(page = 1) {
        return await this.userRepo.getAllUsers(page);
    }

    async deleteUser(userId) {
        return await this.userRepo.deleteUser(userId);
    }

    async updateUser(userId, updatedData) {
        return await this.userRepo.updateUser(userId, updatedData);
    }

    async login(email, password) {
        return await this.userRepo.login(email, password);
    }
}

export { UserService };
