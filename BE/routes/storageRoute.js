import express from "express";
import { resolve } from "../config/serviceContainer.js";
import multer from "multer";

// Resolve controller from DI container (with automatic dependency injection)
const storageController = resolve('storageController');

const Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

Router.get("/upload-url", storageController.getUploadUrl);
Router.post("/upload", upload.single("file"), storageController.uploadProxy);

export const storageRoute = Router;
