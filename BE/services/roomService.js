import { roomRepo } from "../repositories/roomRepo.js";
import redisClient from "../config/redis.js";
const isCacheEnabled = Boolean(redisClient);
class RoomService {
    async createRoom(roomData) {
        // await redisClient.del('room:all');
        const { roomCreated, currentPage } = await roomRepo.createRoom(roomData);
        if (currentPage !== null && isCacheEnabled) {
            await redisClient.del('room:page:' + currentPage);
        }
        return roomCreated;
    }
    async getAllRooms(pageNumber) {
        if (isCacheEnabled) {
            const cachedRooms = await redisClient.get('room:page:' + pageNumber);
            if (cachedRooms) {
                // console.log("Cache hit for rooms page " + pageNumber);
                return JSON.parse(cachedRooms);
            }
        }
        // console.log("Cache miss for rooms page " + pageNumber);
        const data = await roomRepo.getRoomDetails(null, pageNumber);
        if (isCacheEnabled) {
            await redisClient.set('room:page:' + pageNumber, JSON.stringify(data), { EX: 3600 * 12 });
        }
        return data;
    }
    async deleteRoom(roomId) {
        const { totalPages, currentPage } = await roomRepo.deleteRoom(roomId);
        if (!isCacheEnabled) return true;
        for (let page = currentPage; page <= totalPages; page++) {
            await redisClient.del('room:page:' + page);
        }
        // console.log('room:page:' + currentPage + ' to room:page:' + totalPages + ' deleted from cache');
        await redisClient.del('room:' + roomId);
        return true;
    }
    async updateRoom(roomId, updatedData) {
        const { room, currentPage } = await roomRepo.updateRoom(roomId, updatedData);
        if (!isCacheEnabled) return room;
        await redisClient.del('room:page:' + currentPage);
        // console.log(currentPage, 'aaaaa');
        await redisClient.del(`room:${roomId}`);
        return room;
    }

    async getRoomDetails(roomId) {
        if (!isCacheEnabled) return await roomRepo.getRoomDetails(roomId);
        const cachedRoomDetails = await redisClient.get(`room:${roomId}`);
        if (cachedRoomDetails) {
            console.log(`Cache hit for room:${roomId}`);
            return JSON.parse(cachedRoomDetails);
        }
        // console.log(`Cache miss for room:${roomId}`);
        // console.log(pageNumber);
        const roomDetails = await roomRepo.getRoomDetails(roomId);
        await redisClient.set(`room:${roomId}`, JSON.stringify(roomDetails), { EX: 3600 * 24 });
        return roomDetails;
    }

    async searchRooms(criteria) {
        return await roomRepo.searchRooms(criteria);
    }
}

export const roomService = new RoomService();
