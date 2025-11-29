import express from "express";
import { roomController } from "../controllers/roomController.js";
import rateLimitMiddleware from "../middlewares/rateLimitMiddleware.js";
import verifyTokenMiddleware from "../middlewares/verifyTokenMiddleware.js";
const Router = express.Router()
Router.use(rateLimitMiddleware({ capacity: 20, refillRate: 1 }));
Router.use(verifyTokenMiddleware); 

// Public routes
Router.get("/", roomController.getAllRooms);
Router.get("/:id", roomController.getRoomDetails);
Router.post("/search", roomController.searchRooms);

// Protected routes
Router.post("/", roomController.createRoom);
Router.delete("/:id", roomController.deleteRoom);
Router.put("/:id", roomController.updateRoom);
export const roomRoute = Router;

