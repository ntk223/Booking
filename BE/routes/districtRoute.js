import express from "express";
import { resolve } from "../config/serviceContainer.js";

// Resolve controller from DI container (with automatic dependency injection)
const districtController = resolve('districtController');

const Router = express.Router();

Router.get("/", districtController.getAllDistricts);

export const districtRoute = Router;
