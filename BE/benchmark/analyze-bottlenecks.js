#!/usr/bin/env node

/**
 * Bottleneck Analysis Script
 * 
 * Run this after collecting performance data to identify bottlenecks
 */

import { bottleneckDetector } from '../utils/bottleneckDetector.js';
import { queryProfiler } from '../utils/queryProfiler.js';
import { performanceStats } from '../middlewares/performanceMiddleware.js';

console.log('\n===============================================');
console.log('|     SYSTEM BOTTLENECK ANALYSIS TOOL          |');
console.log('===============================================\n');

// Check if we have data
const perfStats = performanceStats.getStats();
const queryStats = queryProfiler.getStats();

if (!perfStats && !queryStats) {
  console.log('[WARNING] No performance data available.');
  console.log('   Please run the server with monitoring enabled and');
  console.log('   generate some traffic before running this analysis.\n');
  console.log('   Start server: node index-monitored.js');
  console.log('   Run load tests: node benchmark/run-benchmarks.js\n');
  process.exit(1);
}

// Print collected stats
if (perfStats) {
  console.log(' Request Performance Statistics:');
  console.log(`   Total Requests: ${perfStats.totalRequests}`);
  console.log(`   Average Duration: ${perfStats.avgDuration}ms`);
  console.log(`   p95: ${perfStats.p95}ms`);
  console.log(`   p99: ${perfStats.p99}ms`);
  console.log(`   Error Rate: ${perfStats.errorRate}`);
  console.log(`   Slow Requests (>1s): ${perfStats.slowRequests}\n`);
}

if (queryStats) {
  console.log('  Database Query Statistics:');
  console.log(`   Total Queries: ${queryStats.totalQueries}`);
  console.log(`   Average Duration: ${queryStats.avgDuration}ms`);
  console.log(`   p95: ${queryStats.p95}ms`);
  console.log(`   p99: ${queryStats.p99}ms`);
  console.log(`   Slow Queries (>100ms): ${queryStats.slowQueries}\n`);
}

// Run bottleneck detection
const bottlenecks = bottleneckDetector.generateReport();

// Print recommendations
bottleneckDetector.printRecommendations();

// Save report
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportPath = join(__dirname, 'results', `bottleneck-report-${timestamp}.json`);

writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  performanceStats: perfStats,
  queryStats: queryStats,
  bottlenecks: bottlenecks
}, null, 2));

console.log(` Full report saved: ${reportPath}\n`);

// Exit with code based on severity
const criticalCount = (bottlenecks.criticalEndpoints?.length || 0) + 
                      (bottlenecks.nPlusOneQueries?.length || 0);

if (criticalCount > 0) {
  console.log(' Critical bottlenecks detected. Immediate action required.\n');
  process.exit(1);
} else {
  console.log(' No critical bottlenecks detected.\n');
  process.exit(0);
}




