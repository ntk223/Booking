class UserService {
    constructor(userRepo, cacheManager) {
        this.userRepo = userRepo;
        this.cacheManager = cacheManager;
    }

    async createUser(userData) {
        const user = await this.userRepo.createUser(userData);
        await this.cacheManager.delPattern('users:page:*');
        return user;
    }

    async getAllUsers(page = 1) {
        const key = `users:page:${page}`;
        return await this.cacheManager.getOrSet(key, async () => {
            return await this.userRepo.getAllUsers(page);
        }, 300); // 5 minutes TTL
    }

    async deleteUser(userId) {
        const result = await this.userRepo.deleteUser(userId);
        await this.cacheManager.delPattern('users:page:*');
        return result;
    }

    async updateUser(userId, updatedData) {
        const result = await this.userRepo.updateUser(userId, updatedData);
        await this.cacheManager.delPattern('users:page:*');
        return result;
    }

    async login(email, password) {
        return await this.userRepo.login(email, password);
    }
}

export { UserService };
