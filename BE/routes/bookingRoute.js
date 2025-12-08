import express from "express";
import { resolve } from "../config/serviceContainer.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { createBookingSchema, updateBookingStatusSchema } from "../validations/bookingValidation.js";

// Resolve controller from DI container (with automatic dependency injection)
const bookingController = resolve('bookingController');

const Router = express.Router();

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - userId
 *               - startTime
 *               - endTime
 *               - date
 *             properties:
 *               roomId:
 *                 type: string
 *               userId:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: time
 *               endTime:
 *                 type: string
 *                 format: time
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid input or room already booked
 */
Router.post("/", bookingController.createBooking);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
               items:
                 type: object
 */
Router.get("/", bookingController.getAllBookings);
// Router.delete("/:id", bookingController.deleteBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, cancelled, pending]
 *     responses:
 *       200:
 *         description: Booking not found
 */
Router.put("/:id", validate(updateBookingStatusSchema), bookingController.updateBookingStatus);
Router.put("/status/:id", validate(updateBookingStatusSchema), bookingController.updateBookingStatus);
Router.put("/:id/status", validate(updateBookingStatusSchema), bookingController.updateBookingStatus);

/**
 * @swagger
 * /bookings/user/{userId}:
 *   get:
 *     summary: Get bookings by user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user bookings
 */
Router.get("/user/:userId", bookingController.getBookingsByUser);

export const bookingRoute = Router;