import { roomRepo } from "../repositories/roomRepo.js";
import safeRedisClient from "../config/redis.js";
class RoomService {
    async createRoom(roomData) {
        // await safeRedisClient.del('room:all');
        const { roomCreated, currentPage } = await roomRepo.createRoom(roomData);
        if (currentPage !== null) {
            await safeRedisClient.del('room:page:' + currentPage);
        }
        return roomCreated;
    }
    async getAllRooms(pageNumber) {
        const cachedRooms = await safeRedisClient.get('room:page:' + pageNumber);
        if (cachedRooms) {
            console.log("Cache hit for rooms page " + pageNumber);
            return JSON.parse(cachedRooms);
        }
        // console.log("Cache miss for rooms page " + pageNumber);
        const data = await roomRepo.getRoomDetails(null, pageNumber);
        await safeRedisClient.set('room:page:' + pageNumber, JSON.stringify(data), { EX: 3600 * 12 });
        return data;
    }
    async deleteRoom(roomId) {
        const { totalPages, currentPage } = await roomRepo.deleteRoom(roomId);
        if (!isCacheEnabled) return true;
        for (let page = currentPage; page <= totalPages; page++) {
            await safeRedisClient.del('room:page:' + page);
        }
        console.log('room:page:' + currentPage + ' to room:page:' + totalPages + ' deleted from cache');
        await safeRedisClient.del('room:' + roomId);
        return true;
    }
    async updateRoom(roomId, updatedData) {
        const { room, currentPage } = await roomRepo.updateRoom(roomId, updatedData);
        await safeRedisClient.del('room:page:' + currentPage);
        console.log(currentPage, 'aaaaa');
        await safeRedisClient.del(`room:${roomId}`);
        return room;
    }

    async getRoomDetails(roomId, pageNumber) {
        const cachedRoomDetails = await safeRedisClient.get(`room:${roomId}`);
        if (cachedRoomDetails) {
            console.log(`Cache hit for room:${roomId}`);
            return JSON.parse(cachedRoomDetails);
        }
        // console.log(`Cache miss for room:${roomId}`);
        // console.log(pageNumber);
        const roomDetails = await roomRepo.getRoomDetails(roomId);
        await safeRedisClient.set(`room:${roomId}`, JSON.stringify(roomDetails), { EX: 3600 * 24 });
        return roomDetails;
    }

    async searchRooms(criteria) {
        return await roomRepo.searchRooms(criteria);
    }
}

export const roomService = new RoomService();
