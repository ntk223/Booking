import Joi from "joi";

export const createRoomSchema = Joi.object({
    name: Joi.string().required(),
    location: Joi.string().required(),
    capacity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required(),
    districtId: Joi.string().required(),
    imageUrl: Joi.string().uri().optional(),
    description: Joi.string().optional()
});

export const updateRoomSchema = Joi.object({
    name: Joi.string().optional(),
    location: Joi.string().optional(),
    capacity: Joi.number().integer().min(1).optional(),
    price: Joi.number().min(0).optional(),
    districtId: Joi.string().optional(),
    imageUrl: Joi.string().uri().optional(),
    description: Joi.string().optional()
});

export const searchRoomSchema = Joi.object({
    capacity: Joi.number().integer().min(1).optional(),
    districtId: Joi.string().optional(),
    searchDate: Joi.string().isoDate().optional(),
    startTime: Joi.number().optional(),
    endTime: Joi.number().optional()
});
