import { Booking, User, Room } from "../models/Model.js";
import { BaseRepository } from "./BaseRepository.js";

class BookingRepository extends BaseRepository {
    constructor() {
        super(Booking);
    }

    async createBooking(bookingData, transaction) {
        return await this.create(bookingData, { transaction });
    }

    async getBookingDetails(bookingId = null) {
        const whereClause = bookingId ? { id: bookingId } : {};
        const bookings = await this.findAll({
            attributes: [
                "id",
                "date",
                "startTime",
                "endTime",
                "status",
                "createdAt",
                "roomId",
                "userId",
            ],
            include: [
                {
                    model: Room,
                    as: "room",
                    attributes: ["name"],
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["name"],
                },
            ],
            where: whereClause,
            raw: true,
            nest: true,
        });

        // Format result
        return bookings.map((b) => ({
            bookingId: b.id,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            status: b.status,
            createdAt: b.createdAt,
            roomId: b.roomId,
            roomName: b.room?.name || null,
            userId: b.userId,
            userName: b.user?.name || null,
        }));
    }

    async updateBookingStatus(bookingId, status) {
        return await this.update(bookingId, { status: status });
    }

    async getBookingsByUserId(userId) {
        const bookings = await this.findAll({
            attributes: [
                "id",
                "date",
                "startTime",
                "endTime",
                "status",
                "createdAt",
                "roomId",
                "userId",
            ],
            include: [
                {
                    model: Room,
                    as: "room",
                    attributes: ["name"],
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["name"],
                },
            ],
            where: { userId: userId },
            raw: true,
            nest: true,
        });

        return bookings.map((b) => ({
            bookingId: b.id,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            status: b.status,
            createdAt: b.createdAt,
            roomId: b.roomId,
            roomName: b.room?.name || null,
            userId: b.userId,
            userName: b.user?.name || null,
        }));
    }
}
export { BookingRepository };
export const bookingRepo = new BookingRepository();