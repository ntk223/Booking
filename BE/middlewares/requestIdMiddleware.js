import { v4 as uuidv4 } from "uuid";
import logger from "../logger/winston.log.js";

/**
 * Request ID Middleware
 *
 * Generates or extracts request ID from headers and attaches it to the request object.
 * This enables request tracing across the application.
 */
export const requestIdMiddleware = (req, res, next) => {
  // Check if request ID is already provided in headers
  let requestId =
    req.headers["x-request-id"] ||
    req.headers["x-correlation-id"] ||
    req.headers["request-id"];

  // If no request ID provided, generate a new one
  if (!requestId) {
    requestId = uuidv4();
  }

  // Attach request ID to request object for easy access
  req.requestId = requestId;

  // Set response header for client to track the request
  res.setHeader("X-Request-ID", requestId);

  // Log incoming request with request ID
  logger.info("Incoming request", {
    utilService: "REQUEST_MIDDLEWARE",
    requestId: requestId,
    method: req.method,
    endpoint: req.originalUrl,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  next();
};

export default requestIdMiddleware;
