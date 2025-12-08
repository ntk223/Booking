import { Booking, User, Room } from "../models/Model.js";
import { BaseRepository } from "./BaseRepository.js";

class BookingRepository extends BaseRepository {
    constructor() {
        super(Booking);
    }

    async createBooking(bookingData, transaction) {
        return await this.create(bookingData, { transaction });
    }

    async getBookingDetails(bookingId = null, page = 1) {
        if (bookingId) {
            const bookings = await this.findAll({
                attributes: ["id", "date", "startTime", "endTime", "status", "createdAt", "roomId", "userId"],
                include: [
                    { model: Room, as: "room", attributes: ["name"] },
                    { model: User, as: "user", attributes: ["name"] },
                ],
                where: { id: bookingId },
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
        } else {
            const { data, currentPage, totalPages } = await this.paginate(page, {
                attributes: ["id", "date", "startTime", "endTime", "status", "createdAt", "roomId", "userId"],
                include: [
                    { model: Room, as: "room", attributes: ["name"] },
                    { model: User, as: "user", attributes: ["name"] },
                ],
                raw: true,
                nest: true,
            });

            const formattedBookings = data.map((b) => ({
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

            return { bookings: formattedBookings, currentPage, totalPages };
        }

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