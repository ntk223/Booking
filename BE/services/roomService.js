import { roomRepo } from "../repositories/roomRepo.js";

class RoomService {
    async createRoom(roomData) {
        return await roomRepo.createRoom(roomData);
    }
    async getAllRooms() {
        return await roomRepo.getRoomDetails();
    }
    async deleteRoom(roomId) {
        return await roomRepo.deleteRoom(roomId);
    }
    async updateRoom(roomId, updatedData) {
        return await roomRepo.updateRoom(roomId, updatedData);
    }

    async getRoomDetails(roomId) {
        return await roomRepo.getRoomDetails(roomId);
    }

    async searchRooms(criteria) {
        return await roomRepo.searchRooms(criteria);
    }
}

export const roomService = new RoomService();
