import logger from "../logger/winston.log.js";

export const requestLoggerMiddleware = (req, res, next) => {
    const startTime = Date.now();

    // Log request
    logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`);

    // Log response on finish
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const message = `Response: ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

        if (res.statusCode >= 400) {
            logger.error(message);
        } else {
            logger.info(message);
        }
    });

    next();
};
