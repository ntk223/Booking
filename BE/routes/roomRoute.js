import express from "express";
import { roomController } from "../controllers/roomController.js";

const Router = express.Router()

Router.get("/", roomController.getAllRooms);
Router.post("/", roomController.createRoom);
Router.delete("/:id", roomController.deleteRoom);
Router.put("/:id", roomController.updateRoom);
Router.get("/:id", roomController.getRoomDetails);
Router.post("/search", roomController.searchRooms);
export const roomRoute = Router;

