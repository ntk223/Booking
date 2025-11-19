import { roomService } from "../services/roomService.js";
import { StatusCodes } from "http-status-codes";

export class RoomController {
    async createRoom(req, res) {
        try {
            const roomData = req.body;
            const newRoom = await roomService.createRoom(roomData);
            res.status(StatusCodes.CREATED).json(newRoom);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }

    async getAllRooms(req, res) {
        try {
            const pageNumber = parseInt(req.query.page) || 1;
            const data = await roomService.getAllRooms(pageNumber);
            res.status(StatusCodes.OK).json(data);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }

    async deleteRoom(req, res) {
        try {
            const roomId = req.params.id;
            await roomService.deleteRoom(roomId);
            res.status(StatusCodes.NO_CONTENT).send();
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }

    async updateRoom(req, res) {
        try {
            const roomId = req.params.id;
            const updatedData = req.body;
            await roomService.updateRoom(roomId, updatedData);
            res.status(StatusCodes.OK).send();
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }

    async getRoomDetails(req, res) {
        try {
            const roomId = req.params.id;
            const roomDetails = await roomService.getRoomDetails(roomId);
            res.status(StatusCodes.OK).json(roomDetails);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }

    async searchRooms(req, res) {
        try {
            const criteria = req.body;
            const rooms = await roomService.searchRooms(criteria);
            // console.log("Rooms found:", "a");
            res.status(StatusCodes.OK).json(rooms);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
}

export const roomController = new RoomController();
