import express from "express";
import compression from "compression";
import { APIs } from "./routes/index.js";

import { env } from "./config/environment.js";
import { errorHandlingMiddleware } from "./middlewares/errorHandlingMiddleware.js";
import { corsOptions } from "./config/cors.js";
import { swaggerDocs } from "./config/swagger.js";
import cors from "cors";
import { healthChecker } from "./utils/HealthChecker.js";
import safeRedisClient from "./config/redis.js";
import logger from "./logger/winston.log.js";
import { requestIdMiddleware } from "./middlewares/requestIdMiddleware.js";
import { requestLoggerMiddleware } from "./middlewares/requestLoggerMiddleware.js";
import {
  getMetrics,
  getContentType,
  httpRequestDurationMicroseconds,
} from "./utils/metrics.js";
import { GCPService } from "./services/GCPService.js";
import { serverAdapter } from "./config/bullBoard.js";
import emailWorker from "./workers/emailWorker.js";
import { getQueueStats } from "./queues/emailQueue.js";

const myGCPService = new GCPService();

const START_SERVER = () => {
  const app = express();

  // const collectDefaultMetrics = client.collectDefaultMetrics;
  // const prefix = "booking_app_";
  // collectDefaultMetrics({ prefix: prefix });

  app.use(cors(corsOptions));

  // Performance: Enable gzip compression for responses > 1KB
  app.use(compression({ threshold: 1024 }));

  app.use(express.json());

  // Request ID middleware (before other middlewares and routes)
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // Prometheus Latency Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      httpRequestDurationMicroseconds
        .labels(
          req.method,
          req.route ? req.route.path : req.path,
          res.statusCode
        )
        .observe(duration / 1000); // Convert to seconds
    });
    next();
  });

  // Health check endpoints (before API routes for fast response)

  // Shallow health check (fast, for load balancers)
  app.get("/health", async (req, res) => {
    const health = await healthChecker.checkShallow();
    const statusCode = healthChecker.getStatusCode(health);
    res.status(statusCode).json(health);
  });

  // Deep health check (thorough, for monitoring dashboards)
  app.get("/health/deep", async (req, res) => {
    const health = await healthChecker.checkDeep();
    const statusCode = healthChecker.getStatusCode(health);
    res.status(statusCode).json(health);
  });

  // Circuit breaker status endpoint
  app.get("/health/circuits", (req, res) => {
    const redisCircuitStatus = safeRedisClient.getCircuitStatus();
    const gcsCircuitStatus = myGCPService.getCircuitStatus();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      circuits: {
        redis: redisCircuitStatus,
        gcs: gcsCircuitStatus,
      },
    });
  });

  // Email queue statistics endpoint
  app.get("/health/queue", async (req, res) => {
    try {
      const stats = await getQueueStats();
      res.status(200).json({
        timestamp: new Date().toISOString(),
        queue: "email-queue",
        stats,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Prometheus Metrics Endpoint
  app.get("/metrics", async (req, res) => {
    try {
      res.set("Content-Type", getContentType());
      res.end(await getMetrics());
    } catch (ex) {
      res.status(500).end(ex);
    }
  });

  // Bull Board UI for queue monitoring
  app.use("/admin/queues", serverAdapter.getRouter());

  app.use("/api", APIs);

  // Xử lý lỗi tập trung trong ứng dụng
  app.use(errorHandlingMiddleware);

  // Tài liệu API với Swagger
  swaggerDocs(app);

  // Kết nối Database
  const server = app.listen(env.APP_PORT, () => {
    logger.info(`Booking System Server Started`);
    logger.info(`API Server: http://localhost:${env.APP_PORT}`);
    logger.info(`Health Check: http://localhost:${env.APP_PORT}/health`);
    logger.info(
      `Deep Health Check: http://localhost:${env.APP_PORT}/health/deep`
    );
    logger.info(
      `Circuit Breaker Status: http://localhost:${env.APP_PORT}/health/circuits`
    );
    logger.info(
      `Queue Monitoring UI: http://localhost:${env.APP_PORT}/admin/queues`
    );
    logger.info(
      `Queue Statistics: http://localhost:${env.APP_PORT}/health/queue\n`
    );
  });

  // Performance: HTTP Keep-Alive settings
  server.keepAliveTimeout = 65000; // Slightly higher than typical load balancer timeout (60s)
  server.headersTimeout = 66000;   // Should be higher than keepAliveTimeout

  // Graceful shutdown
  const gracefulShutdown = async () => {
    logger.info("\n  Received shutdown signal, starting graceful shutdown...");

    // Close email worker
    try {
      await emailWorker.close();
      logger.info(" Email worker closed");
    } catch (error) {
      logger.error(" Error closing email worker:", error);
    }

    server.close(() => {
      logger.info(" HTTP server closed");
      logger.info(" Graceful shutdown completed");
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error(" Forcing shutdown after timeout");
      process.exit(1);
    }, 30000);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
};

START_SERVER();
