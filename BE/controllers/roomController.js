import { roomService } from "../services/roomService.js";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";

export class RoomController {
  createRoom = asyncHandler(async (req, res) => {
    const roomData = req.body;
    const newRoom = await roomService.createRoom(roomData);
    res.status(StatusCodes.CREATED).json(newRoom);
  });

  getRooms = asyncHandler(async (req, res) => {
    const pageNumber = parseInt(req.query.page) || 1;
    const data = await roomService.getRooms(pageNumber);
    res.status(StatusCodes.OK).json(data);
  });

  deleteRoom = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    await roomService.deleteRoom(roomId);
    res.status(StatusCodes.NO_CONTENT).send();
  });

  updateRoom = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    const updatedData = req.body;
    await roomService.updateRoom(roomId, updatedData);
    res.status(StatusCodes.OK).send();
  });

  getRoomDetails = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    const roomDetails = await roomService.getRoomDetails(roomId);
    res.status(StatusCodes.OK).json(roomDetails);
  });

  searchRooms = asyncHandler(async (req, res) => {
    const criteria = req.body;
    const rooms = await roomService.searchRooms(criteria);
    res.status(StatusCodes.OK).json(rooms);
  });
}

export const roomController = new RoomController();
