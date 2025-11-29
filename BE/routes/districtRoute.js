import express from "express";
import { districtController } from "../controllers/districtController.js";

const Router = express.Router();

Router.get("/", districtController.getAllDistricts);

export const districtRoute = Router;
