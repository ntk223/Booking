import GCPService from "../services/GCPService.js";
import { StatusCodes } from "http-status-codes";
import logger, { createLogMetadata } from "../logger/winston.log.js";

export const getUploadUrl = async (req, res) => {
  const startTime = Date.now();

  try {
    const { filename, contentType } = req.query;

    logger.info(
      "Generating upload URL",
      createLogMetadata(
        req,
        null,
        null,
        {
          filename: filename,
          contentType: contentType,
        },
        "STORAGE_CONTROLLER"
      )
    );

    if (!filename || !contentType) {
      logger.error(
        "Filename and contentType are required",
        createLogMetadata(
          req,
          StatusCodes.BAD_REQUEST,
          startTime,
          {
            providedFilename: !!filename,
            providedContentType: !!contentType,
          },
          "STORAGE_CONTROLLER"
        )
      );

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Filename and contentType are required",
      });
    }

    const uniqueFilename = `uploads/${Date.now()}-${filename}`;

    const url = await GCPService.generateUploadUrl(uniqueFilename, contentType);

    logger.info(
      "Upload URL generated successfully",
      createLogMetadata(
        req,
        StatusCodes.OK,
        startTime,
        {
          uniqueFilename: uniqueFilename,
          contentType: contentType,
        },
        "STORAGE_CONTROLLER"
      )
    );

    res.status(StatusCodes.OK).json({
      url,
      publicUrl: `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${uniqueFilename}`,
      filename: uniqueFilename,
    });
  } catch (error) {
    logger.error(
      "Failed to generate upload URL",
      createLogMetadata(
        req,
        StatusCodes.INTERNAL_SERVER_ERROR,
        startTime,
        {
          error: error.message,
          filename: req.query.filename,
          contentType: req.query.contentType,
        },
        "STORAGE_CONTROLLER"
      )
    );

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to generate upload URL",
      error: error.message,
    });
  }
};

export const uploadProxy = async (req, res) => {
  const startTime = Date.now();

  try {
    logger.info(
      "Processing file upload via proxy",
      createLogMetadata(
        req,
        null,
        null,
        {
          hasFile: !!req.file,
        },
        "STORAGE_CONTROLLER"
      )
    );

    if (!req.file) {
      logger.error(
        "No file uploaded",
        createLogMetadata(
          req,
          StatusCodes.BAD_REQUEST,
          startTime,
          {
            contentLength: req.headers["content-length"],
            contentType: req.headers["content-type"],
          },
          "STORAGE_CONTROLLER"
        )
      );

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "No file uploaded",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const uniqueFilename = `uploads/proxy-${Date.now()}-${originalname}`;

    logger.info(
      "Uploading file to GCP",
      createLogMetadata(
        req,
        null,
        null,
        {
          originalFilename: originalname,
          mimeType: mimetype,
          fileSize: buffer.length,
          uniqueFilename: uniqueFilename,
        },
        "STORAGE_CONTROLLER"
      )
    );

    const publicUrl = await GCPService.uploadFile(
      uniqueFilename,
      buffer,
      mimetype
    );

    logger.info(
      "File uploaded successfully",
      createLogMetadata(
        req,
        StatusCodes.OK,
        startTime,
        {
          uniqueFilename: uniqueFilename,
          publicUrl: publicUrl,
          fileSize: buffer.length,
        },
        "STORAGE_CONTROLLER"
      )
    );

    res.status(StatusCodes.OK).json({
      publicUrl,
      filename: uniqueFilename,
    });
  } catch (error) {
    logger.error(
      "Failed to upload file via proxy",
      createLogMetadata(
        req,
        StatusCodes.INTERNAL_SERVER_ERROR,
        startTime,
        {
          error: error.message,
          originalFilename: req.file?.originalname,
          fileSize: req.file?.buffer?.length,
        },
        "STORAGE_CONTROLLER"
      )
    );

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to upload file",
      error: error.message,
    });
  }
};
