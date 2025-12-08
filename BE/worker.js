
import { rawRedisClient, safeRedisClient } from "./config/redis.js";
import { BookingService } from "./services/bookingService.js";
import { bookingRepo } from "./repositories/bookingRepo.js";
import sequelize from "./config/database.js";
import logger from "./logger/winston.log.js";

import { cacheManager } from "./utils/CacheManager.js";
const bookingService = new BookingService(bookingRepo, rawRedisClient, sequelize, cacheManager);

const QUEUE_KEY = "booking:queue";
const PROCESSING_TIMEOUT = 1000;

async function processQueue() {
    logger.info("Worker started processing booking queue...");

    while (true) {
        try {
            // Use rawRedisClient for queue operations (blocking pop)
            // Note: brPop is critical for queue processing, but we handle errors gracefully
            const result = await rawRedisClient.brPop(QUEUE_KEY, 5);

            if (result) {
                const { element } = result;
                const bookingData = JSON.parse(element);

                logger.info(` Processing booking for User ${bookingData.userId}, Room ${bookingData.roomId}...`);

                try {
                    await bookingService.processBookingRequest(bookingData);
                    logger.info(` Booking created successfully for User ${bookingData.userId}`);
                } catch (err) {
                    logger.error(` Booking failed: ${err.message}`);
                    // Optionally: Push to Dead Letter Queue (DLQ) or notify user via WebSocket
                }
            }
        } catch (err) {
            // Handle Redis connection errors gracefully
            if (err.message && !err.message.includes("Socket closed")) {
                logger.error(`Worker Error: ${err.message}`);
            }
            // Wait before retrying to avoid hammering Redis during failures
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

processQueue();

process.on('SIGINT', async () => {
    logger.info("Worker shutting down...");
    await rawRedisClient.disconnect();
    process.exit(0);
});
