import retry from "async-retry";
import logger from "../logger/winston.log.js";

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

  return retry(
    async (bail, attempt) => {
      try {
        // Log attempt (attempt is 1-based in async-retry)
        if (attempt > 1) {
          logger.info(
            `Retry attempt ${attempt - 1}/${maxRetries} for ${operationName}`,
            {
              utilService: "RETRY_PATTERN",
              attempt: attempt - 1,
              maxRetries,
              operationName,
            }
          );
        }

        const result = await operation();

        if (attempt > 1) {
          logger.info(
            `${operationName} succeeded after ${attempt - 1} retries`,
            {
              utilService: "RETRY_PATTERN",
              attempt: attempt - 1,
              operationName,
            }
          );
        }

        return result;
      } catch (error) {
        // Check if we should retry
        if (!shouldRetry(error)) {
          logger.warn(`${operationName} failed with non-retryable error`, {
            utilService: "RETRY_PATTERN",
            error: error.message,
            operationName,
          });
          bail(error);
          return;
        }

        // If this is the last attempt, async-retry will throw the error after this
        // We let async-retry handle the "max retries reached" error throwing.
        throw error;
      }
    },
    {
      retries: maxRetries,
      minTimeout: initialDelay,
      maxTimeout: maxDelay,
      factor: backoffMultiplier,
      randomize: jitter,
      onRetry: (error, attempt) => {
        // async-retry does not provide the *next* delay easily in the callback,
        // so we log the failure here.
        logger.warn(
          `${operationName} failed (attempt ${attempt}/${maxRetries}), retrying...`,
          {
            utilService: "RETRY_PATTERN",
            attempt,
            maxRetries,
            error: error.message,
            operationName,
          }
        );
      },
    }
  );
}

/**
 * Default retry predicate - determines if an error is retryable
 */
function defaultShouldRetry(error) {
  // Network errors
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

  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }

  // Redis-specific errors
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
    error.code == 503 ||
    error.code == 429 ||
    error.message?.includes("ECONNRESET") ||
    error.message?.includes("socket hang up")
  ) {
    return true;
  }

  // Circuit breaker open
  if (error.code === "EOPENBREAKER" || error.type === "OpenCircuitError") {
    return false;
  }

  return false;
}

/**
 * Retry configuration for different service types
 */
export const RETRY_PRESETS = {
  DATABASE: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 2000,
    backoffMultiplier: 2,
    jitter: true,
  },

  CACHE: {
    maxRetries: 2,
    initialDelay: 50,
    maxDelay: 500,
    backoffMultiplier: 2,
    jitter: true,
  },

  EXTERNAL_API: {
    maxRetries: 4,
    initialDelay: 1000,
    maxDelay: 15000,
    backoffMultiplier: 2,
    jitter: true,
  },

  STORAGE: {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true,
  },
};

export function withRedisRetry(operation, operationName) {
  return retryWithExponentialBackoff(operation, {
    ...RETRY_PRESETS.CACHE,
    operationName: operationName || "Redis operation",
  });
}

export function withStorageRetry(operation, operationName) {
  return retryWithExponentialBackoff(operation, {
    ...RETRY_PRESETS.STORAGE,
    operationName: operationName || "GCS operation",
  });
}

export default retryWithExponentialBackoff;
