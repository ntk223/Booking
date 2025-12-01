import express from "express";
import { StorageController } from "../controllers/storageController.js";
import { GCPService } from "../services/GCPService.js";
import multer from "multer";

const myGCPService = new GCPService();
const myStorageController = new StorageController(myGCPService);

const Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

Router.get("/upload-url", myStorageController.getUploadUrl);
Router.post("/upload", upload.single("file"), myStorageController.uploadProxy);

export const storageRoute = Router;
