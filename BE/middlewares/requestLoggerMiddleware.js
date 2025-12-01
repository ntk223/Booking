import logger, { createLogMetadata } from "../logger/winston.log.js";

export const requestLoggerMiddleware = (req, res, next) => {
    const startTime = Date.now();

    // Log request
    logger.info(
        `Incoming Request: ${req.method} ${req.originalUrl}`,
        createLogMetadata(req, null, null, {}, "API_REQUEST")
    );

    // Log response on finish
    res.on("finish", () => {
        const metadata = createLogMetadata(
            req,
            res.statusCode,
            startTime,
            {},
            "API_RESPONSE"
        );

        const message = `Response: ${req.method} ${req.originalUrl} ${res.statusCode} ${metadata.latency}ms`;

        if (res.statusCode >= 400) {
            logger.error(message, metadata);
        } else {
            logger.info(message, metadata);
        }
    });

    next();
};
