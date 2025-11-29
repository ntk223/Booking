import { District } from "../models/Model.js";
import { StatusCodes } from "http-status-codes";

export class DistrictController {
    async getAllDistricts(req, res) {
        try {
            const districts = await District.findAll();
            res.status(StatusCodes.OK).json(districts);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
}

export const districtController = new DistrictController();
