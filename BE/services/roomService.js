

class RoomService {
    constructor(roomRepo, cacheManager) {
        this.roomRepo = roomRepo;
        this.cacheManager = cacheManager;
    }

    async createRoom(roomData) {
        const { roomCreated, currentPage } = await this.roomRepo.createRoom(roomData);
        // Invalidate relevant cache
        await this.cacheManager.delPattern('room:page:*');
        await this.cacheManager.delPattern('room:search:*'); // Invalidate search cache
        return roomCreated;
    }

    async getRooms(pageNumber) {
        if (!this._isValidPageNumber(pageNumber)) return null;
        const key = `room:page:${pageNumber}`;
        return await this.cacheManager.getOrSet(key, async () => {
            return await this.roomRepo.getRoomDetails(null, pageNumber);
        }, 3600 * 12);
    }

    async deleteRoom(roomId) {
        if (!this._isValidRoomId(roomId)) return false;
        const { totalPages, currentPage } = await this.roomRepo.deleteRoom(roomId);
        // Invalidate all pages to be safe and simple
        await this.cacheManager.delPattern('room:page:*');
        await this.cacheManager.delPattern('room:search:*'); // Invalidate search cache
        await this.cacheManager.del(`room:${roomId}`);
        return true;
    }

    async updateRoom(roomId, updatedData) {
        if (!this._isValidRoomId(roomId)) return null;
        const { room, currentPage } = await this.roomRepo.updateRoom(roomId, updatedData);
        await this.cacheManager.delPattern('room:page:*');
        await this.cacheManager.delPattern('room:search:*'); // Invalidate search cache
        await this.cacheManager.del(`room:${roomId}`);
        return room;
    }

    async getRoomDetails(roomId) {
        if (!this._isValidRoomId(roomId)) return null;
        const key = `room:${roomId}`;
        return await this.cacheManager.getOrSet(key, async () => {
            return await this.roomRepo.getRoomDetails(roomId);
        }, 3600 * 24);
    }

    async searchRooms(criteria) {
        const cacheKey = `room:search:${JSON.stringify(criteria)}`;
        return await this.cacheManager.getOrSet(cacheKey, async () => {
            return await this.roomRepo.searchRooms(criteria);
        }, 60);
    }

    _isValidRoomId(roomId) {
        return roomId > 0;
        // return true;
    }

    _isValidPageNumber(pageNumber) {
        return pageNumber > 0;
    }
}

export { RoomService };
