import express from "express";
import { BookingController } from "../controllers/bookingController.js";
import { BookingService } from "../services/bookingService.js";
import { bookingRepo } from "../repositories/bookingRepo.js";
import { rawRedisClient } from "../config/redis.js";
import sequelize from "../config/database.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { createBookingSchema, updateBookingStatusSchema } from "../validations/bookingValidation.js";

// Dependency Injection
const myBookingService = new BookingService(bookingRepo, rawRedisClient, sequelize);
const myBookingController = new BookingController(myBookingService);

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
Router.post("/", validate(createBookingSchema), myBookingController.createBooking);

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
 *               items:
 *                 type: object
 */
Router.get("/", myBookingController.getAllBookings);
// Router.delete("/:id", myBookingController.deleteBooking);

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
 *         description: Booking status updated
 */
Router.put("/:id", validate(updateBookingStatusSchema), myBookingController.updateBookingStatus);
Router.put("/status/:id", validate(updateBookingStatusSchema), myBookingController.updateBookingStatus);
Router.put("/:id/status", validate(updateBookingStatusSchema), myBookingController.updateBookingStatus);

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
Router.get("/user/:userId", myBookingController.getBookingsByUser);

export const bookingRoute = Router;