import { StatusCodes } from "http-status-codes";
import logger, { createLogMetadata } from "../logger/winston.log.js";

export const validationMiddleware = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(", ");

            logger.warn(
                "Validation failed",
                createLogMetadata(
                    req,
                    StatusCodes.BAD_REQUEST,
                    Date.now(),
                    { error: errorMessage },
                    "VALIDATION_MIDDLEWARE"
                )
            );

            return res.status(StatusCodes.BAD_REQUEST).json({ error: errorMessage });
        }

        next();
    };
};
