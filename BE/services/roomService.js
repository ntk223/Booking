import { roomRepo } from "../repositories/roomRepo.js";
import { cacheManager } from "../utils/CacheManager.js";

class RoomService {
    async createRoom(roomData) {
        const { roomCreated, currentPage } = await roomRepo.createRoom(roomData);
        // Invalidate relevant cache
        await cacheManager.delPattern('room:page:*');
        return roomCreated;
    }

    async getRooms(pageNumber) {
        const key = `room:page:${pageNumber}`;
        return await cacheManager.getOrSet(key, async () => {
            return await roomRepo.getRoomDetails(null, pageNumber);
        }, 3600 * 12);
    }

    async deleteRoom(roomId) {
        const { totalPages, currentPage } = await roomRepo.deleteRoom(roomId);
        // Invalidate all pages to be safe and simple
        await cacheManager.delPattern('room:page:*');
        await cacheManager.del(`room:${roomId}`);
        return true;
    }

    async updateRoom(roomId, updatedData) {
        const { room, currentPage } = await roomRepo.updateRoom(roomId, updatedData);
        await cacheManager.delPattern('room:page:*');
        await cacheManager.del(`room:${roomId}`);
        return room;
    }

    async getRoomDetails(roomId) {
        const key = `room:${roomId}`;
        return await cacheManager.getOrSet(key, async () => {
            return await roomRepo.getRoomDetails(roomId);
        }, 3600 * 24);
    }

    async searchRooms(criteria) {
        return await roomRepo.searchRooms(criteria);
    }
}

export const roomService = new RoomService();
