import express from "express";

import { userRoute } from "./userRoute.js";
import { roomRoute } from "./roomRoute.js";
import { bookingRoute } from "./bookingRoute.js";
import { authRoute } from "./authRoute.js";
const Router = express.Router();

Router.use("/user", userRoute);
Router.use("/room", roomRoute);
Router.use("/booking", bookingRoute);
Router.use("/auth", authRoute);
export const APIs = Router;

