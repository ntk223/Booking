import express from "express";
import { bookingController } from "../controllers/bookingController.js";

const Router = express.Router();

Router.post("/", bookingController.createBooking);
Router.get("/", bookingController.getAllBookings);
// Router.delete("/:id", bookingController.deleteBooking);
Router.put("/:id", bookingController.updateBookingStatus);
Router.put("/status/:id", bookingController.updateBookingStatus);
export const bookingRoute = Router;