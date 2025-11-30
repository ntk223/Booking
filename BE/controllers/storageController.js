import GCPService from "../services/GCPService.js";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUploadUrl = asyncHandler(async (req, res) => {
  const { filename, contentType } = req.query;

  if (!filename || !contentType) {
    const error = new Error("Filename and contentType are required");
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const uniqueFilename = `uploads/${Date.now()}-${filename}`;
  const url = await GCPService.generateUploadUrl(uniqueFilename, contentType);

  res.status(StatusCodes.OK).json({
    url,
    publicUrl: `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${uniqueFilename}`,
    filename: uniqueFilename,
  });
});

export const uploadProxy = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error("No file uploaded");
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const { originalname, mimetype, buffer } = req.file;
  const uniqueFilename = `uploads/proxy-${Date.now()}-${originalname}`;

  const publicUrl = await GCPService.uploadFile(
    uniqueFilename,
    buffer,
    mimetype
  );

  res.status(StatusCodes.OK).json({
    publicUrl,
    filename: uniqueFilename,
  });
});
