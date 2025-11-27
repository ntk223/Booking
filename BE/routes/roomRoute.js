import express from "express";
import { roomController } from "../controllers/roomController.js";
import rateLimitMiddleware from "../middlewares/rateLimitMiddleware.js";
import verifyTokenMiddleware from "../middlewares/verifyTokenMiddleware.js";
const Router = express.Router()
Router.use(verifyTokenMiddleware);
Router.use(rateLimitMiddleware({ capacity: 20, refillRate: 1 }));

Router.get("/", roomController.getAllRooms);
Router.post("/", roomController.createRoom);
Router.delete("/:id", roomController.deleteRoom);
Router.put("/:id", roomController.updateRoom);
Router.get("/:id", roomController.getRoomDetails);
Router.post("/search", roomController.searchRooms);
export const roomRoute = Router;

