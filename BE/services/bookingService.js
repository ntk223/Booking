import { bookingRepo } from "../repositories/bookingRepo.js";

class BookingService {
    async createBooking(bookingData) {
        return await bookingRepo.createBooking(bookingData);
    }

    async getAllBookings() {
        return await bookingRepo.getBookingDetails();
    }

    async deleteBooking(bookingId) {
        return await bookingRepo.deleteBooking(bookingId);
    }

    async updateBookingStatus(bookingId, status) {
        return await bookingRepo.updateBookingStatus(bookingId, status);
    }

    async getBookingDetails(bookingId) {
        return await bookingRepo.getBookingDetails(bookingId);
    }
}

export const bookingService = new BookingService();