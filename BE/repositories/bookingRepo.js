import {Booking, User, Room} from "../models/Model.js";
import { Op } from "sequelize";
class BookingRepository {
    async createBooking(bookingData) {
        const existingBookings = await Booking.findAll({
            where: {
                roomId: bookingData.roomId,
                bookingDate: bookingData.date,
                [Op.or]: [
                    {
                        startTime: {
                            [Op.between]: [bookingData.startTime, bookingData.endTime],
                        },
                    },
                    {
                        endTime: {
                            [Op.between]: [bookingData.startTime, bookingData.endTime],
                        },
                    },
                    {
                        [Op.and]: [
                            {
                                startTime: {
                                    [Op.lte]: bookingData.startTime,
                                },
                            },
                            {
                                endTime: {
                                    [Op.gte]: bookingData.endTime,
                                },
                            },
                        ],
                    },
                ],
            },
        });

        if (existingBookings.length > 0) {
            throw new Error("Room is already booked for the selected time slot.");
        }

        return await Booking.create(bookingData);
    }
    async getBookingDetails(bookingId = null) {
        const whereClause = bookingId ? { id: bookingId } : {};
        const bookings = await Booking.findAll({
                attributes: [
                ["id", "bookingId"],
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
            });

            // Format kết quả cho đẹp
            return bookings.map((b) => ({
                bookingId: b.bookingId,
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
        return await Booking.update(
            { status: status },
            { where: { id: bookingId } }
        );
    }
}

export const bookingRepo = new BookingRepository();