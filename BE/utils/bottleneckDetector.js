/**
 * Bottleneck Detection Utility
 * 
 * Analyzes system performance and identifies bottlenecks
 */

import { performanceStats } from '../middlewares/performanceMiddleware.js';
import { queryProfiler } from '../utils/queryProfiler.js';

export class BottleneckDetector {
  constructor() {
    this.thresholds = {
      slowEndpoint: 500,      // ms
      criticalEndpoint: 1000, // ms
      slowQuery: 100,         // ms
      criticalQuery: 500,     // ms
      highErrorRate: 5,       // %
      highMemoryDelta: 50,    // MB
    };
  }

  detectBottlenecks() {
    const bottlenecks = {
      slowEndpoints: [],
      criticalEndpoints: [],
      slowQueries: [],
      nPlusOneQueries: [],
      highErrorRateEndpoints: [],
      memoryLeaks: [],
      timestamp: new Date().toISOString(),
    };

    // Analyze endpoint performance
    const endpointStats = performanceStats.getStats();
    if (endpointStats) {
      const topSlow = performanceStats.getTopSlowEndpoints(20);
      
      topSlow.forEach(endpoint => {
        if (endpoint.duration > this.thresholds.criticalEndpoint) {
          bottlenecks.criticalEndpoints.push({
            ...endpoint,
            severity: 'CRITICAL',
            recommendation: 'Immediate optimization required'
          });
        } else if (endpoint.duration > this.thresholds.slowEndpoint) {
          bottlenecks.slowEndpoints.push({
            ...endpoint,
            severity: 'WARNING',
            recommendation: 'Consider optimization'
          });
        }
      });
    }

    // Analyze query performance
    const queryStats = queryProfiler.getStats();
    if (queryStats) {
      const topSlowQueries = queryProfiler.getTopSlowQueries(20);
      
      topSlowQueries.forEach(query => {
        if (query.duration > this.thresholds.criticalQuery) {
          bottlenecks.slowQueries.push({
            ...query,
            severity: 'CRITICAL',
            recommendations: [
              'Add database indexes',
              'Optimize query structure',
              'Consider caching'
            ]
          });
        } else if (query.duration > this.thresholds.slowQuery) {
          bottlenecks.slowQueries.push({
            ...query,
            severity: 'WARNING',
            recommendations: ['Review query efficiency']
          });
        }
      });

      // Detect potential N+1 queries
      this.detectNPlusOne(bottlenecks);
    }

    return bottlenecks;
  }

  detectNPlusOne(bottlenecks) {
    // Simple N+1 detection: look for similar queries executed many times
    const queries = queryProfiler.queries || [];
    const queryPatterns = new Map();

    queries.forEach(query => {
      // Normalize query by removing specific IDs/values
      const normalized = query.sql
        .replace(/\d+/g, 'N')
        .replace(/'[^']*'/g, "'X'");
      
      if (!queryPatterns.has(normalized)) {
        queryPatterns.set(normalized, []);
      }
      queryPatterns.get(normalized).push(query);
    });

    // Find patterns that repeat many times (potential N+1)
    queryPatterns.forEach((instances, pattern) => {
      if (instances.length > 10 && pattern.includes('SELECT')) {
        bottlenecks.nPlusOneQueries.push({
          pattern: pattern.substring(0, 200),
          occurrences: instances.length,
          totalDuration: instances.reduce((sum, q) => sum + q.duration, 0),
          avgDuration: (instances.reduce((sum, q) => sum + q.duration, 0) / instances.length).toFixed(2),
          severity: 'HIGH',
          recommendation: 'Potential N+1 query. Use JOIN or eager loading.'
        });
      }
    });
  }

  generateReport() {
    const bottlenecks = this.detectBottlenecks();
    
    console.log('\n===============================================');
    console.log('|        BOTTLENECK DETECTION REPORT           |');
    console.log('===============================================\n');

    // Critical Endpoints
    if (bottlenecks.criticalEndpoints.length > 0) {
      console.log(' CRITICAL ENDPOINTS (>1s):');
      bottlenecks.criticalEndpoints.forEach(ep => {
        console.log(`   ${ep.method} ${ep.url}`);
        console.log(`   Duration: ${ep.duration}ms | Status: ${ep.statusCode}`);
        console.log(`   ${ep.recommendation}\n`);
      });
    }

    // Slow Endpoints
    if (bottlenecks.slowEndpoints.length > 0) {
      console.log(' SLOW ENDPOINTS (>500ms):');
      bottlenecks.slowEndpoints.forEach(ep => {
        console.log(`   ${ep.method} ${ep.url} - ${ep.duration}ms`);
      });
      console.log('');
    }

    // Slow Queries
    if (bottlenecks.slowQueries.length > 0) {
      console.log(' SLOW DATABASE QUERIES:');
      bottlenecks.slowQueries.forEach((q, i) => {
        console.log(`   ${i + 1}. [${q.duration}ms] ${q.sql}`);
        if (q.recommendations) {
          q.recommendations.forEach(rec => {
            console.log(`      > ${rec}`);
          });
        }
      });
      console.log('');
    }

    // N+1 Queries
    if (bottlenecks.nPlusOneQueries.length > 0) {
      console.log('  POTENTIAL N+1 QUERIES:');
      bottlenecks.nPlusOneQueries.forEach((q, i) => {
        console.log(`   ${i + 1}. Executed ${q.occurrences} times`);
        console.log(`      Total: ${q.totalDuration}ms | Avg: ${q.avgDuration}ms`);
        console.log(`      Pattern: ${q.pattern}`);
        console.log(`      ${q.recommendation}\n`);
      });
    }

    // Summary
    console.log(' SUMMARY:');
    console.log(`   Critical Issues: ${bottlenecks.criticalEndpoints.length + bottlenecks.nPlusOneQueries.length}`);
    console.log(`   Warnings: ${bottlenecks.slowEndpoints.length + bottlenecks.slowQueries.length}`);
    console.log(`   Total Bottlenecks Detected: ${
      bottlenecks.criticalEndpoints.length +
      bottlenecks.slowEndpoints.length +
      bottlenecks.slowQueries.length +
      bottlenecks.nPlusOneQueries.length
    }`);

    console.log('\n================================================\n');

    return bottlenecks;
  }

  printRecommendations() {
    console.log(' OPTIMIZATION RECOMMENDATIONS:\n');
    console.log('1. Database Optimization:');
    console.log('   - Add indexes on frequently queried columns');
    console.log('   - Use EXPLAIN to analyze query plans');
    console.log('   - Implement database connection pooling\n');
    
    console.log('2. Caching Strategy:');
    console.log('   - Cache frequently accessed data in Redis');
    console.log('   - Implement cache invalidation strategy');
    console.log('   - Use HTTP cache headers\n');
    
    console.log('3. Code Optimization:');
    console.log('   - Use eager loading to prevent N+1 queries');
    console.log('   - Implement pagination for large datasets');
    console.log('   - Add request/response compression\n');
    
    console.log('4. Monitoring:');
    console.log('   - Set up alerting for slow endpoints');
    console.log('   - Monitor database query performance');
    console.log('   - Track memory usage patterns\n');
  }
}

export const bottleneckDetector = new BottleneckDetector();


