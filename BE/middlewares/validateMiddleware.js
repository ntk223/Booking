import { StatusCodes } from "http-status-codes";

export const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(", ");
        const err = new Error(errorMessage);
        err.statusCode = StatusCodes.BAD_REQUEST;
        return next(err);
    }
    next();
};
