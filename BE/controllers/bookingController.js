import { bookingService } from "../services/bookingService.js";
import { StatusCodes } from "http-status-codes";
import logger, { createLogMetadata } from "../logger/winston.log.js";
class BookingController {
  async createBooking(req, res) {
    const startTime = Date.now();

    try {
      const bookingData = req.body;
      logger.info(
        "Creating new booking",
        createLogMetadata(
          req,
          null,
          null,
          {
            userId: bookingData.userId,
            roomId: bookingData.roomId,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
          },
          "BOOKING_CONTROLLER"
        )
      );

      const newBooking = await bookingService.createBooking(bookingData);

      logger.info(
        "Booking created successfully",
        createLogMetadata(
          req,
          StatusCodes.CREATED,
          startTime,
          {
            bookingId: newBooking.bookingId,
            userId: bookingData.userId,
            roomId: bookingData.roomId,
          },
          "BOOKING_CONTROLLER"
        )
      );

      res.status(StatusCodes.CREATED).json(newBooking);
    } catch (error) {
      let statusCode = StatusCodes.BAD_REQUEST;

      // Handle specific error types
      if (
        error.message.includes("already booked") ||
        error.message.includes("Another booking is in progress") ||
        error.message.includes("Missing required fields") ||
        error.message.includes("End time must be after start time")
      ) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
      } else if (error.message.includes("foreign key constraint")) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Invalid room or user ID" });
      } else {
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      }

      logger.error(
        "Failed to create booking",
        createLogMetadata(
          req,
          statusCode,
          startTime,
          {
            error: error.message,
          },
          "BOOKING_CONTROLLER"
        )
      );
    }
  }

  async getAllBookings(req, res) {
    const startTime = Date.now();

    try {
      logger.info(
        "Fetching all bookings",
        createLogMetadata(req, null, null, {}, "BOOKING_CONTROLLER")
      );

      const bookings = await bookingService.getAllBookings();

      logger.info(
        "Successfully retrieved all bookings",
        createLogMetadata(
          req,
          StatusCodes.OK,
          startTime,
          {
            bookingsCount: bookings.length,
          },
          "BOOKING_CONTROLLER"
        )
      );

      res.status(StatusCodes.OK).json(bookings);
    } catch (error) {
      logger.error(
        "Failed to fetch all bookings",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            error: error.message,
          },
          "BOOKING_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  async getBookingDetails(req, res) {
    const startTime = Date.now();

    try {
      const bookingId = req.params.id;

      logger.info(
        "Fetching booking details",
        createLogMetadata(
          req,
          null,
          null,
          {
            bookingId: bookingId,
          },
          "BOOKING_CONTROLLER"
        )
      );

      const bookingDetails = await bookingService.getBookingDetails(bookingId);

      logger.info(
        "Successfully retrieved booking details",
        createLogMetadata(
          req,
          StatusCodes.OK,
          startTime,
          {
            bookingId: bookingId,
            roomId: bookingDetails.roomId,
            userId: bookingDetails.userId,
          },
          "BOOKING_CONTROLLER"
        )
      );

      res.status(StatusCodes.OK).json(bookingDetails);
    } catch (error) {
      logger.error(
        "Failed to fetch booking details",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            bookingId: req.params.id,
            error: error.message,
          },
          "BOOKING_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  // async deleteBooking(req, res) {
  //     try {
  //         const bookingId = req.params.id;
  //         await bookingService.deleteBooking(bookingId);
  //         res.status(StatusCodes.NO_CONTENT).send();
  //     } catch (error) {
  //         res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  //     }
  // }

  async updateBookingStatus(req, res) {
    const startTime = Date.now();

    try {
      const bookingId = req.params.id;
      const { status } = req.body;

      logger.info(
        "Updating booking status",
        createLogMetadata(
          req,
          null,
          null,
          {
            bookingId: bookingId,
            newStatus: status,
          },
          "BOOKING_CONTROLLER"
        )
      );

      await bookingService.updateBookingStatus(bookingId, status);

      logger.info(
        "Booking status updated successfully",
        createLogMetadata(
          req,
          StatusCodes.OK,
          startTime,
          {
            bookingId: bookingId,
            newStatus: status,
          },
          "BOOKING_CONTROLLER"
        )
      );

      res.status(StatusCodes.OK).send();
    } catch (error) {
      logger.error(
        "Failed to update booking status",
        createLogMetadata(
          req,
          StatusCodes.INTERNAL_SERVER_ERROR,
          startTime,
          {
            bookingId: req.params.id,
            newStatus: req.body.status,
            error: error.message,
          },
          "BOOKING_CONTROLLER"
        )
      );

      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}

export const bookingController = new BookingController();
