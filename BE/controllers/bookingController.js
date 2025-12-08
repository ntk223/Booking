
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";

import { BookingDTO } from "../dtos/BookingDTO.js";

export class BookingController {
  constructor({ bookingService }) {
    this.bookingService = bookingService;
  }

  createBooking = asyncHandler(async (req, res) => {
    try {
      const bookingData = req.body;
      await this.bookingService.queueBooking(bookingData);
      res.status(StatusCodes.ACCEPTED).json({ message: "Booking request received", status: "processing" });
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
    const page = parseInt(req.query.page) || 1;
    const data = await this.bookingService.getAllBookings(page);
    res.status(StatusCodes.OK).json({
      bookings: data.bookings.map(b => new BookingDTO(b)),
      currentPage: data.currentPage,
      totalPages: data.totalPages
    });
  });

  getBookingDetails = asyncHandler(async (req, res) => {
    const bookingId = req.params.id;
    const bookingDetails = await this.bookingService.getBookingDetails(bookingId);
    res.status(StatusCodes.OK).json(bookingDetails.map(b => new BookingDTO(b)));
  });

  updateBookingStatus = asyncHandler(async (req, res) => {
    const bookingId = req.params.id;
    const { status } = req.body;
    await this.bookingService.updateBookingStatus(bookingId, status);
    res.status(StatusCodes.OK).send();
  });

  getBookingsByUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const bookings = await this.bookingService.getBookingsByUser(userId);
    res.status(StatusCodes.OK).json(bookings.map(b => new BookingDTO(b)));
  });
}
