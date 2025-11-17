import { roomRepo } from "../repositories/roomRepo.js";
import redisClient from "../config/redis.js";
class RoomService {
    async createRoom(roomData) {
        await redisClient.del('room:all');
        return await roomRepo.createRoom(roomData);
    }
    async getAllRooms() {
        const cachedRooms = await redisClient.get('room:all');
        if (cachedRooms) {
            console.log("Cache hit for allRooms");
            return JSON.parse(cachedRooms);
        }
        console.log("Cache miss for allRooms");
        const rooms = await roomRepo.getRoomDetails();
        await redisClient.set('room:all', JSON.stringify(rooms), { EX: 3600 * 12 });
        return rooms;
    }
    async deleteRoom(roomId) {
        await redisClient.del('room:all');
        await redisClient.del(`room:${roomId}`);
        return await roomRepo.deleteRoom(roomId);
    }
    async updateRoom(roomId, updatedData) {
        await redisClient.del('room:all');
        await redisClient.del(`room:${roomId}`);
        return await roomRepo.updateRoom(roomId, updatedData);
    }

    async getRoomDetails(roomId) {
        const cachedRoomDetails = await redisClient.get(`room:${roomId}`);
        if (cachedRoomDetails) {
            console.log(`Cache hit for room:${roomId}`);
            return JSON.parse(cachedRoomDetails);
        }
        console.log(`Cache miss for room:${roomId}`);
        const roomDetails = await roomRepo.getRoomDetails(roomId);
        await redisClient.set(`room:${roomId}`, JSON.stringify(roomDetails), { EX: 3600 * 24 });
        return roomDetails;
    }

    async searchRooms(criteria) {
        return await roomRepo.searchRooms(criteria);
    }
}

export const roomService = new RoomService();
