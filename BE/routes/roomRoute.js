import express from "express";
import { roomController } from "../controllers/roomController.js";
import rateLimitMiddleware from "../middlewares/rateLimitMiddleware.js";
import verifyTokenMiddleware from "../middlewares/verifyTokenMiddleware.js";
const Router = express.Router()
Router.use(rateLimitMiddleware({ capacity: 20, refillRate: 1 }));
Router.use(verifyTokenMiddleware);

// Public routes
/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
Router.get("/", roomController.getAllRooms);

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Get room details
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room details
 *       404:
 *         description: Room not found
 */
Router.get("/:id", roomController.getRoomDetails);

/**
 * @swagger
 * /rooms/search:
 *   post:
 *     summary: Search rooms
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               capacity:
 *                 type: integer
 *               districtId:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of rooms matching criteria
 */
Router.post("/search", roomController.searchRooms);

// Protected routes

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - capacity
 *               - pricePerHour
 *             properties:
 *               name:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               pricePerHour:
 *                 type: number
 *               description:
 *                 type: string
 *               districtId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Room created successfully
 */
Router.post("/", roomController.createRoom);

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Delete a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room deleted successfully
 */
Router.delete("/:id", roomController.deleteRoom);

/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     summary: Update a room
 *     tags: [Rooms]
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
 *             properties:
 *               name:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               pricePerHour:
 *                 type: number
 *     responses:
 *       200:
 *         description: Room updated successfully
 */
Router.put("/:id", roomController.updateRoom);
export const roomRoute = Router;

