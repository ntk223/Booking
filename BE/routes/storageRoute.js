import express from "express";
import { getUploadUrl, uploadProxy } from "../controllers/storageController.js";
import multer from "multer";

const Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

Router.get("/upload-url", getUploadUrl);
Router.post("/upload", upload.single("file"), uploadProxy);

export const storageRoute = Router;
