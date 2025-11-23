/**
 * Health Checker Utility
 * 
 * Provides comprehensive health checks for all system dependencies.
 * Supports shallow (quick) and deep (thorough) health checks.
 * 
 * @example
 * const health = await healthChecker.checkAll();
 * // Returns: { status: 'healthy', dependencies: {...}, timestamp: ... }
 */

import sequelize from '../config/database.js';
import redisClient from '../config/redis.js';

class HealthChecker {
  constructor() {
    this.thresholds = {
      memoryUsagePercent: 90,    // Max 90% heap usage
      databaseTimeout: 2000,      // 2s timeout for DB checks
      redisTimeout: 1000,         // 1s timeout for Redis checks
      cpuUsagePercent: 85         // Max 85% CPU usage
    };
  }

  /**
   * Check database health
   * @param {boolean} deep - If true, runs actual query; if false, checks connection only
   */
  async checkDatabase(deep = false) {
    const startTime = Date.now();
    
    try {
      if (deep) {
        // Deep check: Execute a simple query
        await Promise.race([
          sequelize.query('SELECT 1+1 as result'),
          this.timeout(this.thresholds.databaseTimeout, 'Database query timeout')
        ]);
      } else {
        // Shallow check: Just verify connection
        await Promise.race([
          sequelize.authenticate(),
          this.timeout(this.thresholds.databaseTimeout, 'Database connection timeout')
        ]);
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'up',
        responseTime: `${responseTime}ms`,
        message: 'Database is healthy',
        details: {
          dialect: sequelize.getDialect(),
          poolSize: sequelize.connectionManager.pool?.size || 0,
          activeConnections: sequelize.connectionManager.pool?.available?.length || 0
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'down',
        responseTime: `${responseTime}ms`,
        message: 'Database is unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check Redis health
   * @param {boolean} deep - If true, tests set/get operations; if false, just pings
   */
  async checkRedis(deep = false) {
    const startTime = Date.now();
    
    try {
      if (!redisClient.isOpen) {
        return {
          status: 'down',
          responseTime: '0ms',
          message: 'Redis client is not connected',
          error: 'Connection not established'
        };
      }

      if (deep) {
        // Deep check: Test actual set/get operations
        const testKey = `health:check:${Date.now()}`;
        const testValue = 'ok';
        
        await Promise.race([
          (async () => {
            await redisClient.set(testKey, testValue, { EX: 5 });
            const value = await redisClient.get(testKey);
            await redisClient.del(testKey);
            
            if (value !== testValue) {
              throw new Error('Redis get/set validation failed');
            }
          })(),
          this.timeout(this.thresholds.redisTimeout, 'Redis operation timeout')
        ]);
      } else {
        // Shallow check: Just ping
        await Promise.race([
          redisClient.ping(),
          this.timeout(this.thresholds.redisTimeout, 'Redis ping timeout')
        ]);
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'up',
        responseTime: `${responseTime}ms`,
        message: 'Redis is healthy'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'down',
        responseTime: `${responseTime}ms`,
        message: 'Redis is unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check memory health
   */
  checkMemory() {
    const usage = process.memoryUsage();
    const heapUsedMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (usage.heapTotal / 1024 / 1024).toFixed(2);
    const rssMB = (usage.rss / 1024 / 1024).toFixed(2);
    const externalMB = (usage.external / 1024 / 1024).toFixed(2);
    
    const heapUsagePercent = ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2);
    const isHealthy = parseFloat(heapUsagePercent) < this.thresholds.memoryUsagePercent;
    
    return {
      status: isHealthy ? 'up' : 'warning',
      message: isHealthy ? 'Memory usage is healthy' : 'Memory usage is high',
      details: {
        heapUsed: `${heapUsedMB} MB`,
        heapTotal: `${heapTotalMB} MB`,
        heapUsagePercent: `${heapUsagePercent}%`,
        rss: `${rssMB} MB`,
        external: `${externalMB} MB`,
        threshold: `${this.thresholds.memoryUsagePercent}%`
      }
    };
  }

  /**
   * Check CPU health (basic check using process.cpuUsage)
   */
  checkCPU() {
    const cpuUsage = process.cpuUsage();
    const uptimeSeconds = process.uptime();
    
    // Calculate CPU usage percentage (rough estimate)
    const totalCPUTime = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    const cpuPercent = ((totalCPUTime / uptimeSeconds) * 100).toFixed(2);
    
    const isHealthy = parseFloat(cpuPercent) < this.thresholds.cpuUsagePercent;
    
    return {
      status: isHealthy ? 'up' : 'warning',
      message: isHealthy ? 'CPU usage is healthy' : 'CPU usage is high',
      details: {
        cpuPercent: `${cpuPercent}%`,
        user: `${(cpuUsage.user / 1000000).toFixed(2)}s`,
        system: `${(cpuUsage.system / 1000000).toFixed(2)}s`,
        uptime: `${uptimeSeconds.toFixed(0)}s`,
        threshold: `${this.thresholds.cpuUsagePercent}%`
      }
    };
  }

  /**
   * Check system uptime
   */
  checkUptime() {
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    
    return {
      status: 'up',
      message: 'System is running',
      details: {
        uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        uptimeSeconds: uptimeSeconds.toFixed(0),
        startedAt: new Date(Date.now() - uptimeSeconds * 1000).toISOString()
      }
    };
  }

  /**
   * Perform shallow health check (fast, for load balancers)
   */
  async checkShallow() {
    const [database, redis] = await Promise.allSettled([
      this.checkDatabase(false),
      this.checkRedis(false)
    ]);

    const memory = this.checkMemory();
    const uptime = this.checkUptime();

    const dependencies = {
      database: database.status === 'fulfilled' ? database.value : { status: 'down', error: database.reason },
      redis: redis.status === 'fulfilled' ? redis.value : { status: 'down', error: redis.reason },
      memory,
      uptime
    };

    // Determine overall status
    // Critical: database must be up
    // Warning: redis can be down (graceful degradation)
    const isCriticalDown = dependencies.database.status === 'down';
    const hasWarnings = dependencies.redis.status === 'down' || 
                        dependencies.memory.status === 'warning';

    const overallStatus = isCriticalDown ? 'unhealthy' : 
                          hasWarnings ? 'degraded' : 
                          'healthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      dependencies
    };
  }

  /**
   * Perform deep health check (thorough, for monitoring dashboards)
   */
  async checkDeep() {
    const [database, redis] = await Promise.allSettled([
      this.checkDatabase(true),
      this.checkRedis(true)
    ]);

    const memory = this.checkMemory();
    const cpu = this.checkCPU();
    const uptime = this.checkUptime();

    const dependencies = {
      database: database.status === 'fulfilled' ? database.value : { status: 'down', error: database.reason },
      redis: redis.status === 'fulfilled' ? redis.value : { status: 'down', error: redis.reason },
      memory,
      cpu,
      uptime
    };

    // Determine overall status
    const isCriticalDown = dependencies.database.status === 'down';
    const hasWarnings = dependencies.redis.status === 'down' || 
                        dependencies.memory.status === 'warning' ||
                        dependencies.cpu.status === 'warning';

    const overallStatus = isCriticalDown ? 'unhealthy' : 
                          hasWarnings ? 'degraded' : 
                          'healthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      dependencies,
      checks: {
        critical: ['database'],
        optional: ['redis'],
        resources: ['memory', 'cpu', 'uptime']
      }
    };
  }

  /**
   * Helper: Create a timeout promise
   */
  timeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Get HTTP status code based on health status
   */
  getStatusCode(healthStatus) {
    switch (healthStatus.status) {
      case 'healthy':
        return 200; // OK
      case 'degraded':
        return 207; // Multi-Status (partial success)
      case 'unhealthy':
        return 503; // Service Unavailable
      default:
        return 500; // Internal Server Error
    }
  }
}

export const healthChecker = new HealthChecker();
