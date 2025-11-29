import logger, { createLogMetadata } from "../logger/winston.log.js";
import { roomService } from "../services/roomService.js";
import { StatusCodes } from "http-status-codes";

// Helper function to create consistent log metadata

export class RoomController {
  async createRoom(req, res) {
    const startTime = Date.now();

    try {
      const roomData = req.body;
      logger.info(
        "Creating a new room",
        createLogMetadata(
          req,
          null,
          null,
          {
            roomName: roomData.roomName,
            capacity: roomData.capacity,
            districtId: roomData.districtId,
          },
          "ROOM_CONTROLLER"
        )
      );

      const newRoom = await roomService.createRoom(roomData);

      logger.info(
        "Room created successfully",
        createLogMetadata(
          req,
          StatusCodes.CREATED,
          Date.now() - startTime,
          {
            roomId: newRoom.roomId,
            roomName: newRoom.roomName,
          },
          "ROOM_CONTROLLER"
        )
      );

      res.status(StatusCodes.CREATED).json(newRoom);
    } catch (error) {
      logger.error(
        "Failed to create room",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          Date.now() - startTime,
          {
            error: error.message,
          }
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  async getAllRooms(req, res) {
    const startTime = Date.now();

    try {
      const pageNumber = parseInt(req.query.page);

      logger.info(
        "Fetching all rooms",
        createLogMetadata(
          req,
          null,
          null,
          {
            pageNumber: pageNumber,
          },
          "ROOM_CONTROLLER"
        )
      );

      const data = await roomService.getAllRooms(pageNumber);

      logger.info(
        "Successfully retrieved all rooms",
        createLogMetadata(
          req,
          StatusCodes.OK,
          Date.now() - startTime,
          {
            totalRooms: data.totalRooms || data.length,
            currentPage: data.currentPage,
          },
          "ROOM_CONTROLLER"
        )
      );

      res.status(StatusCodes.OK).json(data);
    } catch (error) {
      logger.error(
        "Failed to fetch all rooms",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          Date.now() - startTime,
          {
            error: error.message,
          }
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  async deleteRoom(req, res) {
    const startTime = Date.now();

    try {
      const roomId = req.params.id;

      logger.info(
        "Deleting room",
        createLogMetadata(
          req,
          null,
          null,
          {
            roomId: roomId,
          },
          "ROOM_CONTROLLER"
        )
      );

      await roomService.deleteRoom(roomId);

      logger.info(
        "Room deleted successfully",
        createLogMetadata(
          req,
          StatusCodes.NO_CONTENT,
          Date.now() - startTime,
          {
            roomId: roomId,
          },
          "ROOM_CONTROLLER"
        )
      );

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      logger.error(
        "Failed to delete room",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          Date.now() - startTime,
          {
            roomId: req.params.id,
            error: error.message,
          },
          "ROOM_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  async updateRoom(req, res) {
    const startTime = Date.now();

    try {
      const roomId = req.params.id;
      const updatedData = req.body;

      logger.info(
        "Updating room",
        createLogMetadata(
          req,
          null,
          null,
          {
            roomId: roomId,
            updatedFields: Object.keys(updatedData),
          },
          "ROOM_CONTROLLER"
        )
      );

      await roomService.updateRoom(roomId, updatedData);

      logger.info(
        "Room updated successfully",
        createLogMetadata(
          req,
          StatusCodes.OK,
          Date.now() - startTime,
          {
            roomId: roomId,
            updatedFields: Object.keys(updatedData),
          },
          "ROOM_CONTROLLER"
        )
      );

      res.status(StatusCodes.OK).send();
    } catch (error) {
      logger.error(
        "Failed to update room",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          Date.now() - startTime,
          {
            roomId: req.params.id,
            error: error.message,
          },
          "ROOM_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  async getRoomDetails(req, res) {
    const startTime = Date.now();

    try {
      const roomId = req.params.id;

      logger.info(
        "Fetching room details",
        createLogMetadata(
          req,
          null,
          null,
          {
            roomId: roomId,
          },
          "ROOM_CONTROLLER"
        )
      );

      const roomDetails = await roomService.getRoomDetails(roomId);

      logger.info(
        "Successfully retrieved room details",
        createLogMetadata(
          req,
          StatusCodes.OK,
          Date.now() - startTime,
          {
            roomId: roomId,
            roomName: roomDetails.roomName,
            capacity: roomDetails.capacity,
          },
          "ROOM_CONTROLLER"
        )
      );

      res.status(StatusCodes.OK).json(roomDetails);
    } catch (error) {
      logger.error(
        "Failed to fetch room details",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          Date.now() - startTime,
          {
            roomId: req.params.id,
            error: error.message,
          },
          "ROOM_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  async searchRooms(req, res) {
    const startTime = Date.now();

    try {
      const criteria = req.body;

      logger.info(
        "Searching rooms with criteria",
        createLogMetadata(
          req,
          null,
          startTime,
          {
            capacity: criteria.capacity,
            districtId: criteria.districtId,
            hasTimeFilter: !!(criteria.startTime && criteria.endTime),
          },
          "ROOM_CONTROLLER"
        )
      );

      const rooms = await roomService.searchRooms(criteria);

      logger.info(
        "Room search completed",
        createLogMetadata(
          req,
          StatusCodes.OK,
          startTime,
          {
            resultsCount: rooms.length,
            capacity: criteria.capacity,
            districtId: criteria.districtId,
          },
          "ROOM_CONTROLLER"
        )
      );

      res.status(StatusCodes.OK).json(rooms);
    } catch (error) {
      logger.error(
        "Failed to search rooms",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            error: error.message,
          },
          "ROOM_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}

export const roomController = new RoomController();
