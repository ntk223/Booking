/**
 * Performance Monitoring Middleware
 * 
 * Tracks request performance metrics including:
 * - Response time
 * - Slow endpoints (>1s)
 * - Memory usage
 * - Database query timing
 */

export const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  const startMemory = process.memoryUsage();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to measure response time
  res.end = function (chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    const duration = Date.now() - start;
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: ((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2),
      rss: ((endMemory.rss - startMemory.rss) / 1024 / 1024).toFixed(2),
    };

    // Determine log level based on response time
    let logLevel = 'INFO';
    if (duration > 1000) {
      logLevel = 'CRITICAL';
    } else if (duration > 500) {
      logLevel = 'WARNING';
    } else if (duration > 200) {
      logLevel = 'INFO';
    }

    // Log performance metrics
    console.log(
      `[${logLevel}] [${new Date().toISOString()}] ` +
      `${req.method} ${req.originalUrl} | ` +
      `Status: ${res.statusCode} | ` +
      `Duration: ${duration}ms | ` +
      `Memory Delta: ${memoryDelta.heapUsed}MB`
    );

    // Track slow queries separately
    if (duration > 1000) {
      console.warn(
        `[SLOW_ENDPOINT] ${req.method} ${req.originalUrl} took ${duration}ms`
      );
    }

    // Store metrics on response object for potential external monitoring
    res.locals.performanceMetrics = {
      duration,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      memoryDelta,
    };
  };

  next();
};

/**
 * Performance Statistics Collector
 * Collects and aggregates performance metrics
 */
class PerformanceStats {
  constructor() {
    this.requests = [];
    this.maxHistory = 1000; // Keep last 1000 requests
  }

  add(metric) {
    this.requests.push({
      ...metric,
      timestamp: Date.now(),
    });

    // Keep only recent history
    if (this.requests.length > this.maxHistory) {
      this.requests.shift();
    }
  }

  getStats() {
    if (this.requests.length === 0) return null;

    const durations = this.requests.map(r => r.duration).sort((a, b) => a - b);
    const total = durations.length;

    return {
      totalRequests: total,
      avgDuration: (durations.reduce((a, b) => a + b, 0) / total).toFixed(2),
      minDuration: durations[0],
      maxDuration: durations[total - 1],
      p50: durations[Math.floor(total * 0.5)],
      p95: durations[Math.floor(total * 0.95)],
      p99: durations[Math.floor(total * 0.99)],
      slowRequests: this.requests.filter(r => r.duration > 1000).length,
      errorRate: ((this.requests.filter(r => r.statusCode >= 400).length / total) * 100).toFixed(2) + '%',
    };
  }

  getTopSlowEndpoints(limit = 10) {
    return [...this.requests]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(r => ({
        method: r.method,
        url: r.url,
        duration: r.duration,
        statusCode: r.statusCode,
      }));
  }

  reset() {
    this.requests = [];
  }
}

export const performanceStats = new PerformanceStats();

/**
 * Enhanced Performance Middleware with Stats Collection
 */
export const performanceMiddlewareWithStats = (req, res, next) => {
  const start = Date.now();

  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    const duration = Date.now() - start;

    // Add to stats
    performanceStats.add({
      method: req.method,
      url: req.originalUrl,
      duration,
      statusCode: res.statusCode,
    });

    // Log
    let logLevel = 'INFO';
    if (duration > 1000) logLevel = 'CRITICAL';
    else if (duration > 500) logLevel = 'WARNING';
    else if (duration > 200) logLevel = 'INFO';

    console.log(
      `[${logLevel}] ${req.method} ${req.originalUrl} | ` +
      `${res.statusCode} | ${duration}ms`
    );
  };

  next();
};



