import { bookingService } from "../services/bookingService.js";
import { StatusCodes } from "http-status-codes";
class BookingController {
    async createBooking(req, res) {
        try {
            const bookingData = req.body;
            const newBooking = await bookingService.createBooking(bookingData);
            res.status(StatusCodes.CREATED).json(newBooking);
        } catch (error) {
            // Handle specific error types
            if (error.message.includes("already booked") || 
                error.message.includes("Missing required fields") ||
                error.message.includes("End time must be after start time")) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
            } else if (error.message.includes("foreign key constraint")) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid room or user ID" });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
            }
        }
    }

    async getAllBookings(req, res) {
        try {
            const bookings = await bookingService.getAllBookings();
            res.status(StatusCodes.OK).json(bookings);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }

    async getBookingDetails(req, res) {
        try {
            const bookingId = req.params.id;
            const bookingDetails = await bookingService.getBookingDetails(bookingId);
            res.status(StatusCodes.OK).json(bookingDetails);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
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
        try {
            const bookingId = req.params.id;
            const { status } = req.body;
            await bookingService.updateBookingStatus(bookingId, status);
            res.status(StatusCodes.OK).send();
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
}

export const bookingController = new BookingController();