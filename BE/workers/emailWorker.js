import { Worker } from "bullmq";
import { env } from "../config/environment.js";
import logger from "../logger/winston.log.js";
import MailService from "../services/MailService.js";
import { EmailJobType } from "../queues/emailQueue.js";

/**
 * Email Worker - Processes email jobs from the queue
 * Runs as a separate process to handle async email sending
 */

// Redis connection config
const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
};

// Job processor function
const processEmailJob = async (job) => {
  const { name, data, id } = job;

  logger.info("[EMAIL WORKER] Processing email job", {
    jobId: id,
    type: name,
    recipient: data.to,
  });

  try {
    let result;

    switch (name) {
      case EmailJobType.BOOKING_CONFIRMATION:
        result = await MailService.sendBookingConfirmation({
          to: data.to,
          userName: data.userName,
          roomName: data.roomName,
          startTime: data.startTime,
          endTime: data.endTime,
          bookingId: data.bookingId,
        });
        break;

      case EmailJobType.BOOKING_CANCELLATION:
        result = await MailService.sendBookingCancellation({
          to: data.to,
          userName: data.userName,
          roomName: data.roomName,
          startTime: data.startTime,
          bookingId: data.bookingId,
        });
        break;

      case EmailJobType.BOOKING_REMINDER:
        result = await MailService.sendBookingReminder({
          to: data.to,
          userName: data.userName,
          roomName: data.roomName,
          startTime: data.startTime,
          endTime: data.endTime,
          bookingId: data.bookingId,
        });
        break;

      default:
        throw new Error(`Unknown email job type: ${name}`);
    }

    logger.info("[EMAIL WORKER] Email job completed successfully", {
      jobId: id,
      type: name,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    logger.error("[EMAIL WORKER] Email job failed", {
      jobId: id,
      type: name,
      error: error.message,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
    });

    // Re-throw to let BullMQ handle retry logic
    throw error;
  }
};

// Create worker
export const emailWorker = new Worker("email-queue", processEmailJob, {
  connection: redisConnection,
  concurrency: 5, // Process 5 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // Per 1 second
  },
});

// Worker event listeners
emailWorker.on("completed", (job, result) => {
  logger.info("[EMAIL WORKER] Job completed", {
    jobId: job.id,
    type: job.name,
    duration: Date.now() - job.timestamp,
  });
});

emailWorker.on("failed", (job, error) => {
  logger.error("[EMAIL WORKER] Job failed", {
    jobId: job?.id,
    type: job?.name,
    error: error.message,
    attemptsMade: job?.attemptsMade,
  });
});

emailWorker.on("error", (error) => {
  logger.error("[EMAIL WORKER] Worker error:", error);
});

emailWorker.on("stalled", (jobId) => {
  logger.warn("[EMAIL WORKER] Job stalled", { jobId });
});

//Shutdown
process.on("SIGTERM", async () => {
  logger.info("[EMAIL WORKER] Shutting down worker gracefully...");
  await emailWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("[EMAIL WORKER] Shutting down worker gracefully...");
  await emailWorker.close();
  process.exit(0);
});

logger.info("[EMAIL WORKER] Email worker started successfully", {
  concurrency: 5,
  rateLimit: "10 jobs/second",
});

export default emailWorker;
