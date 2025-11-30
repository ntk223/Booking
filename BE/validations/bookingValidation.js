import Joi from "joi";

export const createBookingSchema = Joi.object({
    roomId: Joi.string().required().messages({
        "string.empty": "Room ID is required",
        "any.required": "Room ID is required"
    }),
    userId: Joi.string().required().messages({
        "string.empty": "User ID is required",
        "any.required": "User ID is required"
    }),
    date: Joi.string().required().messages({
        "string.empty": "Date is required",
        "any.required": "Date is required"
    }),
    startTime: Joi.number().required().messages({
        "number.base": "Start time must be a number",
        "any.required": "Start time is required"
    }),
    endTime: Joi.number().required().greater(Joi.ref('startTime')).messages({
        "number.base": "End time must be a number",
        "any.required": "End time is required",
        "number.greater": "End time must be after start time"
    })
});

export const updateBookingStatusSchema = Joi.object({
    status: Joi.string().valid('confirmed', 'cancelled', 'pending').required().messages({
        "any.only": "Status must be one of: confirmed, cancelled, pending",
        "any.required": "Status is required"
    })
});
