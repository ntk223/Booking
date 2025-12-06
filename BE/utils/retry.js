import logger from "../logger/winston.log.js";

/**
 * Retry Pattern with Exponential Backoff
 *
 * Implements resilient retry logic for external service calls to handle transient failures.
 * Uses exponential backoff to avoid overwhelming failing services.
 *
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Retry configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {number} options.backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @param {Function} options.shouldRetry - Custom function to determine if error is retryable
 * @param {string} options.operationName - Name for logging purposes
 * @param {boolean} options.jitter - Add random jitter to prevent thundering herd (default: true)
 * @returns {Promise<*>} - Result of the operation
 * @throws {Error} - Last error if all retries fail
 */
export async function retryWithExponentialBackoff(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
    operationName = "operation",
    jitter = true,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Log retry attempt if not the first attempt
      if (attempt > 0) {
        logger.info(
          `Retry attempt ${attempt}/${maxRetries} for ${operationName}`,
          {
            utilService: "RETRY_PATTERN",
            attempt,
            maxRetries,
            operationName,
          }
        );
      }

      // Execute the operation
      const result = await operation();

      // Log success if we had to retry
      if (attempt > 0) {
        logger.info(`${operationName} succeeded after ${attempt} retries`, {
          utilService: "RETRY_PATTERN",
          attempt,
          operationName,
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        logger.warn(`${operationName} failed with non-retryable error`, {
          utilService: "RETRY_PATTERN",
          error: error.message,
          operationName,
        });
        throw error;
      }

      // last attempt -> throw the error
      if (attempt === maxRetries) {
        logger.error(`${operationName} failed after ${maxRetries} retries`, {
          utilService: "RETRY_PATTERN",
          maxRetries,
          error: error.message,
          operationName,
        });
        throw error;
      }

      // Calculate next delay with exponential backoff
      const calculatedDelay = Math.min(delay, maxDelay);

      // Add jitter to prevent thundering herd problem
      const finalDelay = jitter
        ? calculatedDelay + Math.random() * calculatedDelay * 0.3 // ±30% jitter
        : calculatedDelay;

      logger.warn(
        `${operationName} failed (attempt ${attempt + 1}/${
          maxRetries + 1
        }), retrying in ${Math.round(finalDelay)}ms`,
        {
          utilService: "RETRY_PATTERN",
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          delay: Math.round(finalDelay),
          error: error.message,
          operationName,
        }
      );

      // Wait before next retry
      await sleep(finalDelay);

      // Increase delay for next iteration (exponential backoff)
      delay *= backoffMultiplier;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Default retry predicate - determines if an error is retryable
 * Retries on network errors, timeouts, and 5xx server errors
 * Does NOT retry on 4xx client errors (bad request, auth, etc.)
 */
function defaultShouldRetry(error) {
  // Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
  if (
    error.code === "ECONNREFUSED" ||
    error.code === "ETIMEDOUT" ||
    error.code === "ENOTFOUND" ||
    error.code === "ECONNRESET" ||
    error.code === "EPIPE"
  ) {
    return true;
  }

  if (error.name === "TimeoutError" || error.message?.includes("timeout")) {
    return true;
  }

  // HTTP 5xx server errors
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // HTTP status code in error object
  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }

  // Redis-specific errors that are retryable
  if (
    error.message?.includes("Redis") &&
    (error.message.includes("connection") ||
      error.message.includes("READONLY") ||
      error.message.includes("LOADING"))
  ) {
    return true;
  }

  // GCS-specific retryable errors
  if (
    error.code === 503 || // Service Unavailable
    error.code === 429 || // Too Many Requests
    error.message?.includes("ECONNRESET") ||
    error.message?.includes("socket hang up")
  ) {
    return true;
  }

  // Circuit breaker open - don't retry
  if (error.code === "EOPENBREAKER" || error.type === "OpenCircuitError") {
    return false;
  }

  // Default: don't retry
  return false;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry configuration for different service types
 */
export const RETRY_PRESETS = {
  // daatabase operations
  DATABASE: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 2000,
    backoffMultiplier: 2,
    jitter: true,
  },

  // cache operations
  CACHE: {
    maxRetries: 2,
    initialDelay: 50,
    maxDelay: 500,
    backoffMultiplier: 2,
    jitter: true,
  },

  // External API calls
  EXTERNAL_API: {
    maxRetries: 4,
    initialDelay: 1000,
    maxDelay: 15000,
    backoffMultiplier: 2,
    jitter: true,
  },

  // file storage
  STORAGE: {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true,
  },
};

/**
 * Wrapper for Redis operations with retry
 */
export function withRedisRetry(operation, operationName) {
  return retryWithExponentialBackoff(operation, {
    ...RETRY_PRESETS.CACHE,
    operationName: operationName || "Redis operation",
  });
}

/**
 * Wrapper for GCS operations with retry
 */
export function withStorageRetry(operation, operationName) {
  return retryWithExponentialBackoff(operation, {
    ...RETRY_PRESETS.STORAGE,
    operationName: operationName || "GCS operation",
  });
}

export default retryWithExponentialBackoff;
