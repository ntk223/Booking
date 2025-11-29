import { Booking, User, Room } from "../models/Model.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { rawRedisClient } from "../config/redis.js";

class BookingRepository {
    async createBooking(bookingData) {
        // Input validation
        if (!bookingData.roomId || !bookingData.userId || !bookingData.date || !bookingData.startTime || !bookingData.endTime) {
            throw new Error("Missing required fields: roomId, userId, date, startTime, endTime");
        }

        // Validate time range
        if (bookingData.startTime >= bookingData.endTime) {
            throw new Error("End time must be after start time");
        }

        // Create distributed lock key
        const lockKey = `booking:lock:${bookingData.roomId}:${bookingData.date}:${bookingData.startTime}`;
        const lockValue = `${Date.now()}-${Math.random()}`;
        const lockTTL = 10; // 10 seconds TTL

        let lockAcquired = false;

        try {
            // Try to acquire distributed lock using Redis
            lockAcquired = await rawRedisClient.set(lockKey, lockValue, {
                EX: lockTTL,
                NX: true  // Only set if not exists
            });

            if (!lockAcquired) {
                throw new Error("Another booking is in progress for this time slot. Please try again.");
            }

            // Use database transaction with Redis lock for double protection
            return await sequelize.transaction(async (t) => {
                const existingBookings = await Booking.findAll({
                    where: {
                        roomId: bookingData.roomId,
                        date: bookingData.date,
                        status: {
                            [Op.ne]: 'cancelled'
                        },
                        [Op.not]: {
                            [Op.or]: [
                                { endTime: { [Op.lte]: bookingData.startTime } },  // cũ kết thúc trước hoặc đúng lúc mới bắt đầu → không trùng
                                { startTime: { [Op.gte]: bookingData.endTime } },  // cũ bắt đầu sau hoặc đúng lúc mới kết thúc → không trùng
                            ]
                        }
                    },
                    lock: t.LOCK.UPDATE,
                    transaction: t
                });

                if (existingBookings.length > 0) {
                    throw new Error("Room is already booked for the selected time slot.");
                }

                return await Booking.create(bookingData, { transaction: t });
            });
        } catch (error) {
            throw error;
        } finally {
            // Release Redis lock if we acquired it
            if (lockAcquired) {
                try {
                    const currentValue = await rawRedisClient.get(lockKey);
                    // Only delete if we still own the lock
                    if (currentValue === lockValue) {
                        await rawRedisClient.del(lockKey);
                    }
                } catch (err) {
                    console.error('[ERROR] Failed to release Redis lock:', err.message);
                }
            }
        }
    }

    async getBookingDetails(bookingId = null) {
        const whereClause = bookingId ? { id: bookingId } : {};
        const bookings = await Booking.findAll({
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

        console.log("Raw bookings from DB:", bookings[0]); // Debug log

        // Format kết quả cho đẹp
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
        return await Booking.update(
            { status: status },
            { where: { id: bookingId } }
        );
    }

    async getBookingsByUserId(userId) {
        const bookings = await Booking.findAll({
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

export const bookingRepo = new BookingRepository();