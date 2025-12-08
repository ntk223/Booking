import redis from "redis";
import { env } from "./environment.js";
import CircuitBreaker from "opossum";
import logger from "../logger/winston.log.js";
import { registerCircuitBreaker } from "../utils/metrics.js";

const redisClient = redis.createClient({
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  disableOfflineQueue: true,
  socket: {
    reconnectStrategy: (retries) => {
      // Infinite retries: Wait 50ms, 100ms, ... up to max 3000ms (3s)
      return Math.min(retries * 50, 3000);
    },
  },
});

redisClient.on("error", (err) => {
  logger.error(`Redis error: ${err.message}`, {
    utilService: "REDIS",
  });
});

redisClient.on("connect", () => {
  logger.info("Connecting to Redis...", {
    utilService: "REDIS",
  });
});

redisClient.on("ready", () => {
  logger.info(`Redis client ready. Host: ${env.REDIS_HOST}:${env.REDIS_PORT}`, {
    utilService: "REDIS",
  });
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error(`Redis connection failed: ${err.message}`, {
      utilService: "REDIS",
    });
    logger.warn(`Redis is not available. Caching will be disabled.`, {
      utilService: "REDIS",
    });
  }
})();

/**
 * SafeRedisClient - Wraps Redis operations with Circuit Breaker (Opossum)
 *
 * Provides graceful degradation when Redis is unavailable.
 * - GET operations return null (cache miss)
 * - SET/DEL operations silently succeed (best-effort caching)
 * - Circuit breaker prevents cascading failures
 */
class SafeRedisClient {
  constructor(client) {
    this.client = client;

    // Options for Opossum
    const options = {
      name: 'redis-circuit-breaker', // Name is important for metrics
      timeout: env.CIRCUIT_BREAKER_TIMEOUT, // If function takes longer than this, trigger failure
      errorThresholdPercentage: env.CIRCUIT_BREAKER_FAILURE_THRESHOLD * 100,
      resetTimeout: env.CIRCUIT_BREAKER_TIMEOUT, // Wait before trying again (Half-Open)
      volumeThreshold: env.CIRCUIT_BREAKER_VOLUME_THRESHOLD, // Minimum requests before circuit can open
      rollingCountTimeout: env.CIRCUIT_BREAKER_ROLLING_COUNT_TIMEOUT, // Rolling window for failure rate calculation
    };

    // Create circuit breaker wrapping a generic execution function
    // We pass the actual operation as an argument to fire()
    this.circuitBreaker = new CircuitBreaker(async (operation) => operation(), options);

    // Register with Prometheus
    registerCircuitBreaker(this.circuitBreaker);

    // Listen to circuit breaker events for logging
    this.circuitBreaker.on("open", () => {
      logger.error(
        `Redis circuit opened. Entering graceful degradation mode.`,
        {
          utilService: "CIRCUIT_BREAKER",
        }
      );
    });

    this.circuitBreaker.on("close", () => {
      logger.info(
        "Redis circuit closed. Cache operations restored.",
        {
          utilService: "CIRCUIT_BREAKER",
        }
      );
    });

    this.circuitBreaker.on("halfOpen", () => {
      logger.info(
        "Redis circuit half-open. Testing recovery...",
        {
          utilService: "CIRCUIT_BREAKER",
        }
      );
    });
    this.startHeartbeat();
  }

  /**
   * Start periodic health check
   */
  startHeartbeat() {
    setInterval(async () => {
      try {
        await this.ping();
      } catch (err) {
      }
    }, 5000).unref();
  }

  /**
   * Safe GET operation - Returns null if circuit is open or operation fails
   */
  async get(key) {
    try {
      return await this.circuitBreaker.fire(async () => await this.client.get(key));
    } catch (error) {
      // If circuit is open or request failed, treat as cache miss
      if (error.code === 'EOPENBREAKER' || error.type === 'OpenCircuitError') {
        // Circuit is open, gracefully degrade
        return null;
      }

      // Log error but don't throw - treat as cache miss
      logger.warn(`GET failed for key "${key}": ${error.message}`, {
        utilService: "REDIS",
      });
      return null;
    }
  }

  /**
   * Safe SET operation - Silently succeeds if circuit is open or operation fails
   */
  async set(key, value, options) {
    try {
      await this.circuitBreaker.fire(async () => await this.client.set(key, value, options));
      return true;
    } catch (error) {
      if (error.code === 'EOPENBREAKER' || error.type === 'OpenCircuitError') {
        // Circuit is open, skip caching silently
        return true;
      }
      // Log error but don't throw - best-effort caching
      logger.warn(`SET failed for key "${key}": ${error.message}`, {
        utilService: "REDIS",
      });
      return false;
    }
  }

  /**
   * Safe DEL operation - Silently succeeds if circuit is open or operation fails
   */
  async del(key) {
    try {
      await this.circuitBreaker.fire(async () => await this.client.del(key));
      return true;
    } catch (error) {
      if (error.code === 'EOPENBREAKER' || error.type === 'OpenCircuitError') {
        // Circuit is open, skip invalidation silently
        return true;
      }
      // Log error but don't throw - best-effort invalidation
      logger.warn(`DEL failed for key "${key}": ${error.message}`, {
        utilService: "REDIS",
      });
      return false;
    }
  }

  /**
   * Safe PING operation - Used for health checks
   */
  async ping() {
    // Use circuit breaker for ping too, so failures count towards opening the circuit
    return await this.circuitBreaker.fire(async () => await this.client.ping());
  }

  /**
   * Check if client is connected
   */
  get isOpen() {
    return this.client.isOpen;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitStatus() {
    // Opossum stats
    return this.circuitBreaker.stats;
  }

  /**
   * Expose raw client for operations that need direct access
   * (like distributed locks which are critical and should fail fast)
   */
  getRawClient() {
    return this.client;
  }
}

// Export both raw client (for critical operations like locks) and safe client (for caching)
export const rawRedisClient = redisClient;
export const safeRedisClient = new SafeRedisClient(redisClient);
export default safeRedisClient;
