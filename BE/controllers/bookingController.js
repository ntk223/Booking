import { bookingService } from "../services/bookingService.js";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";

class BookingController {
  createBooking = asyncHandler(async (req, res) => {
    try {
      const bookingData = req.body;
      const newBooking = await bookingService.createBooking(bookingData);
      res.status(StatusCodes.CREATED).json(newBooking);
    } catch (error) {
      if (
        error.message.includes("already booked") ||
        error.message.includes("Another booking is in progress") ||
        error.message.includes("Missing required fields") ||
        error.message.includes("End time must be after start time") ||
        error.message.includes("foreign key constraint")
      ) {
        error.statusCode = StatusCodes.BAD_REQUEST;
        if (error.message.includes("foreign key constraint")) {
          error.message = "Invalid room or user ID";
        }
      }
      throw error;
    }
  });

  getAllBookings = asyncHandler(async (req, res) => {
    const bookings = await bookingService.getAllBookings();
    res.status(StatusCodes.OK).json(bookings);
  });

  getBookingDetails = asyncHandler(async (req, res) => {
    const bookingId = req.params.id;
    const bookingDetails = await bookingService.getBookingDetails(bookingId);
    res.status(StatusCodes.OK).json(bookingDetails);
  });

  updateBookingStatus = asyncHandler(async (req, res) => {
    const bookingId = req.params.id;
    const { status } = req.body;
    await bookingService.updateBookingStatus(bookingId, status);
    res.status(StatusCodes.OK).send();
  });

  getBookingsByUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const bookings = await bookingService.getBookingsByUser(userId);
    res.status(StatusCodes.OK).json(bookings);
  });
}

export const bookingController = new BookingController();
