import redis from 'redis';
import {env} from './environment.js';
import { CircuitBreaker } from '../utils/CircuitBreaker.js';

const redisClient = redis.createClient({
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('[ERROR] Redis max retries exceeded');
        return new Error('Redis max retries exceeded');
      }
      return Math.min(retries * 50, 500);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('[ERROR] Redis error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[INFO] Connecting to Redis...');
});

redisClient.on('ready', () => {
  console.log('[INFO] Redis client ready');
  console.log(`   Host: ${env.REDIS_HOST}:${env.REDIS_PORT}\n`);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('[ERROR] Redis connection failed:', err.message);
    console.warn('[WARNING] Redis is not available. Caching will be disabled.');
  }
})();

/**
 * SafeRedisClient - Wraps Redis operations with Circuit Breaker
 * 
 * Provides graceful degradation when Redis is unavailable.
 * - GET operations return null (cache miss)
 * - SET/DEL operations silently succeed (best-effort caching)
 * - Circuit breaker prevents cascading failures
 */
class SafeRedisClient {
  constructor(client) {
    this.client = client;
    
    // Create circuit breaker with configuration from environment
    this.circuitBreaker = new CircuitBreaker('redis', {
      failureThreshold: env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || 0.5,
      windowSize: env.CIRCUIT_BREAKER_WINDOW_SIZE || 20,
      timeout: env.CIRCUIT_BREAKER_TIMEOUT || 30000,
      successThreshold: env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || 2,
      minRequestCount: 5
    });

    // Listen to circuit breaker events for logging
    this.circuitBreaker.on('stateChanged', (event) => {
      if (event.to === 'OPEN') {
        console.error(
          `[CIRCUIT_BREAKER] Redis circuit opened due to high failure rate ` +
          `(${(event.failureRate * 100).toFixed(1)}%). Entering graceful degradation mode.`
        );
      } else if (event.to === 'CLOSED') {
        console.log('[CIRCUIT_BREAKER] Redis circuit closed. Cache operations restored.');
      }
    });
  }

  /**
   * Safe GET operation - Returns null if circuit is open or operation fails
   */
  async get(key) {
    try {
      return await this.circuitBreaker.execute(
        async () => await this.client.get(key),
        async () => null // Fallback: treat as cache miss
      );
    } catch (error) {
      if (error.circuitBreakerOpen) {
        // Circuit is open, gracefully degrade
        return null;
      }
      // Log error but don't throw - treat as cache miss
      console.warn(`[REDIS] GET failed for key "${key}": ${error.message}`);
      return null;
    }
  }

  /**
   * Safe SET operation - Silently succeeds if circuit is open or operation fails
   */
  async set(key, value, options) {
    try {
      return await this.circuitBreaker.execute(
        async () => await this.client.set(key, value, options),
        async () => true // Fallback: pretend success (best-effort caching)
      );
    } catch (error) {
      if (error.circuitBreakerOpen) {
        // Circuit is open, skip caching silently
        return true;
      }
      // Log error but don't throw - best-effort caching
      console.warn(`[REDIS] SET failed for key "${key}": ${error.message}`);
      return false;
    }
  }

  /**
   * Safe DEL operation - Silently succeeds if circuit is open or operation fails
   */
  async del(key) {
    try {
      return await this.circuitBreaker.execute(
        async () => await this.client.del(key),
        async () => true // Fallback: pretend success (best-effort invalidation)
      );
    } catch (error) {
      if (error.circuitBreakerOpen) {
        // Circuit is open, skip invalidation silently
        return true;
      }
      // Log error but don't throw - best-effort invalidation
      console.warn(`[REDIS] DEL failed for key "${key}": ${error.message}`);
      return false;
    }
  }

  /**
   * Safe PING operation - Used for health checks
   */
  async ping() {
    return await this.client.ping();
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
    return this.circuitBreaker.getStatus();
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