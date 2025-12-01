

class RoomService {
    constructor(roomRepo, cacheManager) {
        this.roomRepo = roomRepo;
        this.cacheManager = cacheManager;
    }

    async createRoom(roomData) {
        const { roomCreated, currentPage } = await this.roomRepo.createRoom(roomData);
        // Invalidate relevant cache
        await this.cacheManager.delPattern('room:page:*');
        return roomCreated;
    }

    async getRooms(pageNumber) {
        const key = `room:page:${pageNumber}`;
        return await this.cacheManager.getOrSet(key, async () => {
            return await this.roomRepo.getRoomDetails(null, pageNumber);
        }, 3600 * 12);
    }

    async deleteRoom(roomId) {
        const { totalPages, currentPage } = await this.roomRepo.deleteRoom(roomId);
        // Invalidate all pages to be safe and simple
        await this.cacheManager.delPattern('room:page:*');
        await this.cacheManager.del(`room:${roomId}`);
        return true;
    }

    async updateRoom(roomId, updatedData) {
        const { room, currentPage } = await this.roomRepo.updateRoom(roomId, updatedData);
        await this.cacheManager.delPattern('room:page:*');
        await this.cacheManager.del(`room:${roomId}`);
        return room;
    }

    async getRoomDetails(roomId) {
        const key = `room:${roomId}`;
        return await this.cacheManager.getOrSet(key, async () => {
            return await this.roomRepo.getRoomDetails(roomId);
        }, 3600 * 24);
    }

    async searchRooms(criteria) {
        return await this.roomRepo.searchRooms(criteria);
    }
}

export { RoomService };
