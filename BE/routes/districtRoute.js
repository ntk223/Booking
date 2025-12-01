import express from "express";
import { DistrictController } from "../controllers/districtController.js";

const myDistrictController = new DistrictController();

const Router = express.Router();

Router.get("/", myDistrictController.getAllDistricts);

export const districtRoute = Router;
