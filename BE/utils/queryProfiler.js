/**
 * Database Query Profiler
 * 
 * Monitors and logs slow database queries to identify bottlenecks
 */

export class QueryProfiler {
  constructor() {
    this.queries = [];
    this.maxHistory = 500;
    this.slowQueryThreshold = 100; // ms
  }

  logQuery(sql, duration, type = 'SELECT') {
    const queryInfo = {
      sql: sql.length > 200 ? sql.substring(0, 200) + '...' : sql,
      duration,
      type,
      timestamp: new Date().toISOString(),
      isSlow: duration > this.slowQueryThreshold,
    };

    this.queries.push(queryInfo);

    // Keep only recent history
    if (this.queries.length > this.maxHistory) {
      this.queries.shift();
    }

    // Log slow queries
    if (queryInfo.isSlow) {
      console.warn(
        ` SLOW QUERY (${duration}ms): ${queryInfo.sql}`
      );
    }

    return queryInfo;
  }

  getStats() {
    if (this.queries.length === 0) return null;

    const durations = this.queries.map(q => q.duration).sort((a, b) => a - b);
    const total = durations.length;

    return {
      totalQueries: total,
      avgDuration: (durations.reduce((a, b) => a + b, 0) / total).toFixed(2),
      minDuration: durations[0],
      maxDuration: durations[total - 1],
      p50: durations[Math.floor(total * 0.5)],
      p95: durations[Math.floor(total * 0.95)],
      p99: durations[Math.floor(total * 0.99)],
      slowQueries: this.queries.filter(q => q.isSlow).length,
      queryTypes: this.getQueryTypeBreakdown(),
    };
  }

  getQueryTypeBreakdown() {
    const breakdown = {};
    this.queries.forEach(q => {
      const type = q.type || 'UNKNOWN';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    return breakdown;
  }

  getTopSlowQueries(limit = 10) {
    return [...this.queries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(q => ({
        sql: q.sql,
        duration: q.duration,
        type: q.type,
        timestamp: q.timestamp,
      }));
  }

  reset() {
    this.queries = [];
  }

  printReport() {
    const stats = this.getStats();
    if (!stats) {
      console.log('No query data available.');
      return;
    }

    console.log('\n===============================================');
    console.log('|         DATABASE QUERY PROFILER REPORT        |');
    console.log('===============================================\n');

    console.log(' Query Statistics:');
    console.log(`   Total Queries: ${stats.totalQueries}`);
    console.log(`   Average Duration: ${stats.avgDuration}ms`);
    console.log(`   Min Duration: ${stats.minDuration}ms`);
    console.log(`   Max Duration: ${stats.maxDuration}ms`);
    console.log(`   p50: ${stats.p50}ms`);
    console.log(`   p95: ${stats.p95}ms`);
    console.log(`   p99: ${stats.p99}ms`);
    console.log(`   Slow Queries (>${this.slowQueryThreshold}ms): ${stats.slowQueries}\n`);

    console.log(' Query Type Breakdown:');
    Object.entries(stats.queryTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    if (stats.slowQueries > 0) {
      console.log('\n Top 10 Slowest Queries:');
      const topSlow = this.getTopSlowQueries(10);
      topSlow.forEach((q, i) => {
        console.log(`   ${i + 1}. [${q.duration}ms] ${q.sql}`);
      });
    }

    console.log('\n================================================\n');
  }
}

export const queryProfiler = new QueryProfiler();

/**
 * Sequelize Logging Hook
 * 
 * Usage in database.js:
 * logging: (sql, timing) => {
 *   queryProfiler.logQuery(sql, timing);
 * }
 */
export function createSequelizeLogger(profiler) {
  return (sql, timing) => {
    // Extract query type
    const queryType = sql.split(' ')[0].toUpperCase();
    profiler.logQuery(sql, timing, queryType);
  };
}


