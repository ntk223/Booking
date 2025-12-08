import { Op } from "sequelize";
import { Booking } from "../models/Model.js";
import {
  queueBookingConfirmation,
  queueBookingCancellation,
  queueBookingReminder,
} from "../queues/emailQueue.js";
import logger from "../logger/winston.log.js";

class BookingService {
  constructor(bookingRepo, redisClient, sequelize) {
    this.bookingRepo = bookingRepo;
    this.redisClient = redisClient;
    this.sequelize = sequelize;
  }

  async createBooking(bookingData) {
    // Create distributed lock key
    const lockKey = `booking:lock:${bookingData.roomId}:${bookingData.date}:${bookingData.startTime}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    const lockTTL = 10; // 10 seconds TTL

    let lockAcquired = false;

    try {
      // Try to acquire distributed lock using Redis
      lockAcquired = await this.redisClient.set(lockKey, lockValue, {
        EX: lockTTL,
        NX: true, // Only set if not exists
      });

      if (!lockAcquired) {
        throw new Error(
          "Another booking is in progress for this time slot. Please try again."
        );
      }

      // Use database transaction with Redis lock for double protection
      return await this.sequelize.transaction(async (t) => {
        // Check for overlapping bookings
        const existingBookings = await Booking.findAll({
          where: {
            roomId: bookingData.roomId,
            date: bookingData.date,
            status: {
              [Op.ne]: "cancelled",
            },
            [Op.not]: {
              [Op.or]: [
                { endTime: { [Op.lte]: bookingData.startTime } },
                { startTime: { [Op.gte]: bookingData.endTime } },
              ],
            },
          },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (existingBookings.length > 0) {
          throw new Error("Room is already booked for the selected time slot.");
        }

        const newBooking = await this.bookingRepo.createBooking(bookingData, t);

        // Queue confirmation email after successful booking
        try {
          // Get user and room details for email
          const bookingDetails = await Booking.findByPk(newBooking.id, {
            include: ["User", "Room"],
            transaction: t,
          });

          if (bookingDetails?.User?.email) {
            // Queue booking confirmation email
            await queueBookingConfirmation({
              userEmail: bookingDetails.User.email,
              userName:
                bookingDetails.User.fullName || bookingDetails.User.email,
              roomName: bookingDetails.Room?.name || "Unknown Room",
              startTime: `${bookingDetails.date} ${bookingDetails.startTime}`,
              endTime: `${bookingDetails.date} ${bookingDetails.endTime}`,
              bookingId: bookingDetails.id,
            });

            // Queue reminder email (sent 1 day before)
            await queueBookingReminder({
              userEmail: bookingDetails.User.email,
              userName:
                bookingDetails.User.fullName || bookingDetails.User.email,
              roomName: bookingDetails.Room?.name || "Unknown Room",
              startTime: `${bookingDetails.date} ${bookingDetails.startTime}`,
              endTime: `${bookingDetails.date} ${bookingDetails.endTime}`,
              bookingId: bookingDetails.id,
            });

            logger.info("[BOOKING] Emails queued for booking", {
              bookingId: newBooking.id,
            });
          }
        } catch (emailError) {
          // Don't fail booking if email queueing fails
          logger.error("[BOOKING] Failed to queue emails:", emailError);
        }

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
          console.error("[ERROR] Failed to release Redis lock:", err.message);
        }
      }
    }
  }

  async getAllBookings() {
    return await this.bookingRepo.getBookingDetails();
  }

  async deleteBooking(bookingId) {
    return await this.bookingRepo.deleteBooking(bookingId);
  }

  async updateBookingStatus(bookingId, status) {
    const result = await this.bookingRepo.updateBookingStatus(
      bookingId,
      status
    );

    // If status is cancelled, queue cancellation email
    if (status === "cancelled") {
      try {
        const bookingDetails = await Booking.findByPk(bookingId, {
          include: ["User", "Room"],
        });

        if (bookingDetails?.User?.email) {
          await queueBookingCancellation({
            userEmail: bookingDetails.User.email,
            userName: bookingDetails.User.fullName || bookingDetails.User.email,
            roomName: bookingDetails.Room?.name || "Unknown Room",
            startTime: `${bookingDetails.date} ${bookingDetails.startTime}`,
            bookingId: bookingDetails.id,
          });

          logger.info("[BOOKING] Cancellation email queued", { bookingId });
        }
      } catch (emailError) {
        logger.error(
          "[BOOKING] Failed to queue cancellation email:",
          emailError
        );
      }
    }

    return result;
  }

  async getBookingDetails(bookingId) {
    return await this.bookingRepo.getBookingDetails(bookingId);
  }

  async getBookingsByUser(userId) {
    return await this.bookingRepo.getBookingsByUserId(userId);
  }
}

export { BookingService };
