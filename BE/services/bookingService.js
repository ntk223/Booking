import { bookingRepo } from "../repositories/bookingRepo.js";
import { rawRedisClient } from "../config/redis.js";
import sequelize from "../config/database.js";
import { Op } from "sequelize";
import { Booking } from "../models/Model.js";

class BookingService {
    async createBooking(bookingData) {
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
                // Check for overlapping bookings
                const existingBookings = await Booking.findAll({
                    where: {
                        roomId: bookingData.roomId,
                        date: bookingData.date,
                        status: {
                            [Op.ne]: 'cancelled'
                        },
                        [Op.not]: {
                            [Op.or]: [
                                { endTime: { [Op.lte]: bookingData.startTime } },
                                { startTime: { [Op.gte]: bookingData.endTime } },
                            ]
                        }
                    },
                    lock: t.LOCK.UPDATE,
                    transaction: t
                });

                if (existingBookings.length > 0) {
                    throw new Error("Room is already booked for the selected time slot.");
                }

                return await bookingRepo.createBooking(bookingData, t);
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

    async getBookingsByUser(userId) {
        return await bookingRepo.getBookingsByUserId(userId);
    }
}

export const bookingService = new BookingService();