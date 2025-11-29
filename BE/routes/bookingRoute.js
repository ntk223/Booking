import express from "express";
import { bookingController } from "../controllers/bookingController.js";

const Router = express.Router();

Router.post("/", bookingController.createBooking);
Router.get("/", bookingController.getAllBookings);
// Router.delete("/:id", bookingController.deleteBooking);
Router.put("/:id", bookingController.updateBookingStatus);
Router.put("/status/:id", bookingController.updateBookingStatus);
Router.put("/:id/status", bookingController.updateBookingStatus);
Router.get("/user/:userId", bookingController.getBookingsByUser);
export const bookingRoute = Router;