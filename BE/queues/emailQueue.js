import { Queue } from "bullmq";
import { env } from "../config/environment.js";
import logger from "../logger/winston.log.js";

// Redis connection config for BullMQ
const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
};

// Create Email Queue
export const emailQueue = new Queue("email-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Maximum retry times
    backoff: {
      type: "exponential",
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: {
      age: 24 * 60 * 60, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
    },
  },
});

// Queue event listeners
emailQueue.on("error", (error) => {
  logger.error("[EMAIL QUEUE] Queue error:", error);
});

// Email job types
export const EmailJobType = {
  BOOKING_CONFIRMATION: "booking-confirmation",
  BOOKING_CANCELLATION: "booking-cancellation",
  BOOKING_REMINDER: "booking-reminder",
};

// Priority levels
export const EmailPriority = {
  HIGH: 1, // Booking confirmation/cancellation
  NORMAL: 5, // General notifications
  LOW: 10, // Reminders, reports
};

export async function queueBookingConfirmation(data) {
  try {
    const job = await emailQueue.add(
      EmailJobType.BOOKING_CONFIRMATION,
      {
        to: data.userEmail,
        userName: data.userName,
        roomName: data.roomName,
        startTime: data.startTime,
        endTime: data.endTime,
        bookingId: data.bookingId,
      },
      {
        priority: EmailPriority.HIGH,
        jobId: `booking-confirm-${data.bookingId}`,
      }
    );

    logger.info("[EMAIL QUEUE] Booking confirmation email queued", {
      jobId: job.id,
      bookingId: data.bookingId,
    });

    return job;
  } catch (error) {
    logger.error("[EMAIL QUEUE] Failed to queue booking confirmation:", error);
    throw error;
  }
}

export async function queueBookingCancellation(data) {
  try {
    const job = await emailQueue.add(
      EmailJobType.BOOKING_CANCELLATION,
      {
        to: data.userEmail,
        userName: data.userName,
        roomName: data.roomName,
        startTime: data.startTime,
        bookingId: data.bookingId,
      },
      {
        priority: EmailPriority.HIGH,
        jobId: `booking-cancel-${data.bookingId}`,
      }
    );

    logger.info("[EMAIL QUEUE] Booking cancellation email queued", {
      jobId: job.id,
      bookingId: data.bookingId,
    });

    return job;
  } catch (error) {
    logger.error("[EMAIL QUEUE] Failed to queue booking cancellation:", error);
    throw error;
  }
}

export async function queueBookingReminder(data) {
  try {
    // Calculate delay - send reminder 1 day before booking
    const startTime = new Date(data.startTime);
    const reminderTime = new Date(startTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
    const now = new Date();
    const delay = Math.max(0, reminderTime.getTime() - now.getTime());

    const job = await emailQueue.add(
      EmailJobType.BOOKING_REMINDER,
      {
        to: data.userEmail,
        userName: data.userName,
        roomName: data.roomName,
        startTime: data.startTime,
        endTime: data.endTime,
        bookingId: data.bookingId,
      },
      {
        priority: EmailPriority.LOW,
        delay: delay, // Delayed job
        jobId: `booking-reminder-${data.bookingId}`,
      }
    );

    logger.info("[EMAIL QUEUE] Booking reminder email scheduled", {
      jobId: job.id,
      bookingId: data.bookingId,
      reminderTime: reminderTime.toISOString(),
      delayMs: delay,
    });

    return job;
  } catch (error) {
    logger.error("[EMAIL QUEUE] Failed to queue booking reminder:", error);
    throw error;
  }
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error("[EMAIL QUEUE] Failed to get queue stats:", error);
    throw error;
  }
}

logger.info("[EMAIL QUEUE] Email queue initialized successfully");
