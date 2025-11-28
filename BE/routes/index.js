import express from "express";

import { userRoute } from "./userRoute.js";
import { roomRoute } from "./roomRoute.js";
import { bookingRoute } from "./bookingRoute.js";
import { authRoute } from "./authRoute.js";
import { storageRoute } from "./storageRoute.js";
import { districtRoute } from "./districtRoute.js";
const Router = express.Router();

Router.use("/users", userRoute);
Router.use("/rooms", roomRoute);
Router.use("/bookings", bookingRoute);
Router.use("/auth", authRoute);
Router.use("/storage", storageRoute);
Router.use("/districts", districtRoute);
export const APIs = Router;

