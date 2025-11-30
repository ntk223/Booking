import { District } from "../models/Model.js";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";

export class DistrictController {
    getAllDistricts = asyncHandler(async (req, res) => {
        const districts = await District.findAll();
        res.status(StatusCodes.OK).json(districts);
    });
}

export const districtController = new DistrictController();
