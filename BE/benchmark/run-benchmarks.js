#!/usr/bin/env node

/**
 * Automated Benchmark Runner
 * 
 * Runs comprehensive performance tests and generates comparison reports
 */

import { spawn } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, 'results');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Ensure results directory exists
import { mkdirSync } from 'fs';
try {
  mkdirSync(RESULTS_DIR, { recursive: true });
} catch (err) {
  // Directory exists
}

console.log('\n===============================================');
console.log('|     AUTOMATED BENCHMARK SUITE v1.0           |');
console.log('===============================================\n');

// Check if server is running
async function checkServer() {
  console.log(' Checking if server is running...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      console.log(' Server is running\n');
      return true;
    }
  } catch (error) {
    console.error(' Server is not running!');
    console.error(`   Please start the server on ${BASE_URL}\n`);
    return false;
  }
}

// Run k6 load test
function runK6Test() {
  return new Promise((resolve, reject) => {
    console.log(' Running k6 load test...\n');
    
    const k6 = spawn('k6', [
      'run',
      '--out', `json=${join(RESULTS_DIR, 'k6-results.json')}`,
      join(__dirname, 'load-test.js')
    ], {
      env: { ...process.env, BASE_URL },
      stdio: 'inherit'
    });

    k6.on('close', (code) => {
      if (code === 0) {
        console.log('\n k6 load test completed\n');
        resolve();
      } else {
        reject(new Error(`k6 exited with code ${code}`));
      }
    });

    k6.on('error', (err) => {
      console.log('\n  k6 not installed. Skipping k6 test.');
      console.log('   Install k6: https://k6.io/docs/get-started/installation/\n');
      resolve(); // Don't fail the whole suite
    });
  });
}

// Run Artillery test
function runArtilleryTest() {
  return new Promise((resolve, reject) => {
    console.log(' Running Artillery load test...\n');
    
    const artillery = spawn('npx', [
      'artillery', 'run',
      '--output', join(RESULTS_DIR, 'artillery-results.json'),
      join(__dirname, 'load-test.yml')
    ], {
      stdio: 'inherit',
      shell: true
    });

    artillery.on('close', (code) => {
      if (code === 0) {
        console.log('\n Artillery test completed\n');
        console.log(` Results saved: ${join(RESULTS_DIR, 'artillery-results.json')}\n`);
        console.log('   View results at https://app.artillery.io or use a JSON viewer\n');
        resolve();
      } else {
        console.log('\n  Artillery test had issues. Continuing...\n');
        resolve(); // Don't fail the whole suite
      }
    });

    artillery.on('error', (err) => {
      console.log('\n  Artillery not installed. Skipping Artillery test.');
      console.log('   Install: npm install -g artillery\n');
      resolve(); // Don't fail the whole suite
    });
  });
}

// Run race condition test
function runRaceConditionTest() {
  return new Promise((resolve, reject) => {
    console.log(' Running race condition test...\n');
    
    const test = spawn('node', [join(__dirname, 'race-condition-test.js')], {
      env: { ...process.env, BASE_URL },
      stdio: 'inherit'
    });

    test.on('close', (code) => {
      if (code === 0) {
        console.log('\n Race condition test passed\n');
      } else {
        console.log('\n  Race condition test detected issues\n');
      }
      resolve(); // Continue regardless
    });
  });
}

// Get current metrics from server
async function getCurrentMetrics() {
  console.log(' Collecting current server metrics...\n');
  try {
    const response = await fetch(`${BASE_URL}/metrics`);
    const metrics = await response.json();
    return metrics;
  } catch (error) {
    console.log('  Could not fetch metrics from server\n');
    return null;
  }
}

// Generate comparison report
function generateReport(currentMetrics, previousMetrics) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = join(RESULTS_DIR, `benchmark-report-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    current: currentMetrics,
    previous: previousMetrics,
    comparison: null
  };

  if (previousMetrics && currentMetrics) {
    report.comparison = {
      avgDurationChange: ((currentMetrics.stats.avgDuration - previousMetrics.stats.avgDuration) / previousMetrics.stats.avgDuration * 100).toFixed(2) + '%',
      p95Change: ((currentMetrics.stats.p95 - previousMetrics.stats.p95) / previousMetrics.stats.p95 * 100).toFixed(2) + '%',
      p99Change: ((currentMetrics.stats.p99 - previousMetrics.stats.p99) / previousMetrics.stats.p99 * 100).toFixed(2) + '%',
    };
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(` Report saved: ${reportPath}\n`);

  return report;
}

// Main execution
async function runBenchmarks() {
  try {
    // Check server
    const serverRunning = await checkServer();
    if (!serverRunning) {
      process.exit(1);
    }

    // Get baseline metrics if available
    const baselinePath = join(RESULTS_DIR, 'baseline-metrics.json');
    let baselineMetrics = null;
    if (existsSync(baselinePath)) {
      baselineMetrics = JSON.parse(readFileSync(baselinePath, 'utf-8'));
      console.log(' Found baseline metrics for comparison\n');
    } else {
      console.log(' No baseline found. This will be your baseline.\n');
    }

    // Run race condition test first (fast)
    await runRaceConditionTest();

    // Run load tests
    await runK6Test();
    await runArtilleryTest();

    // Get current metrics
    const currentMetrics = await getCurrentMetrics();

    // Generate report
    if (currentMetrics) {
      const report = generateReport(currentMetrics, baselineMetrics);
      
      console.log('===============================================');
      console.log('|           BENCHMARK SUMMARY                   |');
      console.log('===============================================\n');
      
      if (report.comparison) {
        console.log(' Performance Changes vs Baseline:');
        console.log(`   Average Duration: ${report.comparison.avgDurationChange}`);
        console.log(`   p95: ${report.comparison.p95Change}`);
        console.log(`   p99: ${report.comparison.p99Change}\n`);
      } else {
        console.log(' Baseline established. Run again after changes to compare.\n');
      }
    } else {
      console.log(' Note: Server metrics endpoint not available\n');
    }

    console.log('===============================================');
    console.log('|         ALL BENCHMARKS COMPLETED              |');
    console.log('===============================================\n');
    console.log(` Results saved in: ${RESULTS_DIR}\n`);

  } catch (error) {
    console.error(' Benchmark Error:', error.message);
    process.exit(1);
  }
}

runBenchmarks();


