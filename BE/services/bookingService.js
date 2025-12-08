import { Op } from "sequelize";
import { Booking } from "../models/Model.js";
import logger from "../logger/winston.log.js";

class BookingService {
    constructor({ bookingRepo, redisClient, sequelize, cacheManager }) {
        this.bookingRepo = bookingRepo;
        this.redisClient = redisClient;
        this.sequelize = sequelize;
        this.cacheManager = cacheManager;
    }

    async queueBooking(bookingData) {
        // Push booking data to Redis Queue
        const QUEUE_KEY = "booking:queue";
        await this.redisClient.lPush(QUEUE_KEY, JSON.stringify(bookingData));
        return true;
    }

    async processBookingRequest(bookingData) {
        // Create distributed lock key
        const lockKey = `booking:lock:${bookingData.roomId}:${bookingData.date}:${bookingData.startTime}`;
        const lockValue = `${Date.now()}-${Math.random()}`;
        const lockTTL = 10; // 10 seconds TTL

        let lockAcquired = false;

        try {
            // Try to acquire distributed lock using Redis
            lockAcquired = await this.redisClient.set(lockKey, lockValue, {
                EX: lockTTL,
                NX: true  // Only set if not exists
            });

            if (!lockAcquired) {
                throw new Error("Another booking is in progress for this time slot. Please try again.");
            }

            // Use database transaction with Redis lock for double protection
            return await this.sequelize.transaction(async (t) => {
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

                const newBooking = await this.bookingRepo.createBooking(bookingData, t);

                // Invalidate User History Cache
                await this.cacheManager.del(`bookings:user:${bookingData.userId}`);

                return newBooking;
            });
        } catch (error) {
            throw error;
        } finally {
            // Release Redis lock if we acquired it
            if (lockAcquired) {
                try {
                    const currentValue = await this.redisClient.get(lockKey);
                    // Only delete if we still own the lock
                    if (currentValue === lockValue) {
                        await this.redisClient.del(lockKey);
                    }
                } catch (err) {
                    logger.error('Failed to release Redis lock', {
                        error: err.message,
                        lockKey,
                        lockValue,
                        utilService: 'BOOKING_SERVICE'
                    });
                }
            }
        }
    }

    async getAllBookings(page = 1) {
        return await this.bookingRepo.getBookingDetails(null, page);
    }

    async deleteBooking(bookingId) {
        return await this.bookingRepo.deleteBooking(bookingId);
    }

    async updateBookingStatus(bookingId, status) {
        const result = await this.bookingRepo.updateBookingStatus(bookingId, status);
        // We need userId to invalidate cache. 
        // Ideally we should fetch booking first, but that adds overhead.
        // Alternatively, we can clear ALL user caches? No.
        // Let's fetch the booking briefly to get userId.
        try {
            const booking = await this.bookingRepo.findById(bookingId);
            if (booking) {
                await this.cacheManager.del(`bookings:user:${booking.userId}`);
                logger.info('Cache invalidated after booking status update', {
                    bookingId,
                    userId: booking.userId,
                    newStatus: status,
                    utilService: 'BOOKING_SERVICE'
                });
            } else {
                logger.warn('Booking not found for cache invalidation', {
                    bookingId,
                    utilService: 'BOOKING_SERVICE'
                });
            }
        } catch (err) {
            logger.error('Failed to invalidate cache after booking status update', {
                error: err.message,
                bookingId,
                status,
                utilService: 'BOOKING_SERVICE'
            });
        }
        return result;
    }

    async getBookingDetails(bookingId) {
        return await this.bookingRepo.getBookingDetails(bookingId);
    }

    async getBookingsByUser(userId) {
        // Cache key: bookings:user:{userId}
        const key = `bookings:user:${userId}`;
        return await this.cacheManager.getOrSet(key, async () => {
            return await this.bookingRepo.getBookingsByUserId(userId);
        }, 300); // 5 minutes TTL
    }
}

export { BookingService };