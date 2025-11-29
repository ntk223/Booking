"use strict";

import winston from "winston";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = process.env.LOG_DIR || path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
}

const { combine, errors, timestamp, splat, printf } = winston.format;

const textFormat = printf(
  ({
    timestamp,
    level,
    message,
    stack,
    utilService,
    statusCode,
    method,
    endpoint,
    latency,
    requestId,
    ip,
    ...meta
  }) => {
    const levelUpper = level.toUpperCase();

    const utilServiceTag = utilService ? ` [${utilService}]` : "";
    const statusCodeTag = statusCode ? ` ${statusCode}` : "";
    const methodTag = method ? ` [${method}]` : "";
    const idTag = requestId ? ` [${requestId}]` : "";
    const ipTag = ip ? ` ${ip}` : "";
    const endpointTag = endpoint ? ` ${endpoint}` : "";
    const latencyTag = latency !== undefined ? ` ${latency}ms` : "";

    if (stack) {
      return `${timestamp} [${levelUpper}]${utilServiceTag}${idTag}${ipTag}${methodTag}${endpointTag}${latencyTag}${statusCodeTag} ${message}\n${stack}`;
    }

    let metaString = "";
    if (Object.keys(meta).length > 0) {
      metaString = ` ${JSON.stringify(meta)}`;
    }

    return `${timestamp} [${levelUpper}]${utilServiceTag}${idTag}${ipTag}${methodTag}${endpointTag}${latencyTag}${statusCodeTag} ${message}${metaString}`;
  }
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    errors({ stack: true }),
    splat(),
    textFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      options: { flags: "a" },
    }),
    new winston.transports.File({
      filename: path.join(logDir, "app.log"),
      options: { flags: "a" },
    }),
  ],
});

// Keep child logger
logger.child = (context = {}) => {
  return {
    info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
    error: (message, meta = {}) =>
      logger.error(message, { ...context, ...meta }),
    debug: (message, meta = {}) =>
      logger.debug(message, { ...context, ...meta }),
    verbose: (message, meta = {}) =>
      logger.verbose(message, { ...context, ...meta }),
  };
};

export const createLogMetadata = (
  req,
  statusCode = null,
  startTime = null,
  payload = {},
  utilService = "CONTROLLER"
) => {
  const metadata = {
    utilService,
    requestId: req.requestId,
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
    payload,
  };

  if (statusCode) metadata.statusCode = statusCode;
  if (startTime !== null) metadata.latency = Date.now() - startTime;

  return metadata;
};

export default logger;
