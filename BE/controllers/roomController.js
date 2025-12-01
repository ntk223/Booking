
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";

import { RoomDTO } from "../dtos/RoomDTO.js";

export class RoomController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  createRoom = asyncHandler(async (req, res) => {
    const roomData = req.body;
    const newRoom = await this.roomService.createRoom(roomData);
    res.status(StatusCodes.CREATED).json(new RoomDTO(newRoom));
  });

  getRooms = asyncHandler(async (req, res) => {
    const pageNumber = parseInt(req.query.page) || 1;
    const data = await this.roomService.getRooms(pageNumber);
    res.status(StatusCodes.OK).json({
      ...data,
      rooms: data.rooms.map(room => new RoomDTO(room))
    });
  });

  deleteRoom = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    await this.roomService.deleteRoom(roomId);
    res.status(StatusCodes.NO_CONTENT).send();
  });

  updateRoom = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    const updatedData = req.body;
    const room = await this.roomService.updateRoom(roomId, updatedData);
    res.status(StatusCodes.OK).json(new RoomDTO(room));
  });

  getRoomDetails = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    const roomDetails = await this.roomService.getRoomDetails(roomId);
    res.status(StatusCodes.OK).json(new RoomDTO(roomDetails));
  });

  searchRooms = asyncHandler(async (req, res) => {
    const criteria = req.body;
    const rooms = await this.roomService.searchRooms(criteria);
    res.status(StatusCodes.OK).json(rooms.map(room => new RoomDTO(room)));
  });
}
