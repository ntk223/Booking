import GCPService from "../services/GCPService.js";
import { StatusCodes } from "http-status-codes";

export const getUploadUrl = async (req, res) => {
    try {
        const { filename, contentType } = req.query;

        if (!filename || !contentType) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "Filename and contentType are required",
            });
        }

        const uniqueFilename = `uploads/${Date.now()}-${filename}`;

        const url = await GCPService.generateUploadUrl(uniqueFilename, contentType);

        res.status(StatusCodes.OK).json({
            url,
            publicUrl: `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${uniqueFilename}`,
            filename: uniqueFilename
        });
    } catch (error) {
        console.error("Error generating upload URL", error?.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to generate upload URL",
            error: error.message,
        });
    }
};

export const uploadProxy = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "No file uploaded",
            });
        }

        const { originalname, mimetype, buffer } = req.file;
        const uniqueFilename = `uploads/proxy-${Date.now()}-${originalname}`;

        const publicUrl = await GCPService.uploadFile(uniqueFilename, buffer, mimetype);

        res.status(StatusCodes.OK).json({
            publicUrl,
            filename: uniqueFilename
        });
    } catch (error) {
        console.error("Error uploading file (proxy):", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Failed to upload file",
            error: error.message,
        });
    }
};
