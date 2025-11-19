# Performance Testing & Monitoring Suite

Complete toolkit for measuring performance, finding bottlenecks, and comparing improvements.

## 📁 Files Created

### Load Testing
- `load-test.yml` - Artillery configuration for HTTP load testing
- `load-test.js` - k6 script with detailed metrics
- `race-condition-test.js` - Concurrent booking test
- `run-benchmarks.js` - Automated test runner

### Monitoring
- `index-monitored.js` - Enhanced server with monitoring
- `performanceMiddleware.js` - Request performance tracking
- `queryProfiler.js` - Database query profiling
- `bottleneckDetector.js` - Bottleneck analysis
- `analyze-bottlenecks.js` - Analysis script

### Configuration
- `database-profiled.js` - Database config with connection pooling

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
cd BE

# Install monitoring dashboard and Faker for test data
npm install express-status-monitor @faker-js/faker

# Install load testing tools (optional but recommended)
npm install -g artillery
npm install -g k6
```

### 2. Seed Database with Realistic Data

**IMPORTANT:** Your database must have realistic data for accurate benchmarks!

```powershell
# Start database
docker-compose up -d mysql

# Seed with realistic data using Faker
npm run seed
```

This creates:
- 100 users (realistic names, emails, phones)
- 10 districts (city districts)
- 50 meeting rooms (with capacities, prices, locations)
- 15 equipment types
- 500 bookings (spread across dates/times)

### 3. Start Monitored Server

```powershell
# Option 1: Use the monitored version
node index-monitored.js

# Option 2: Keep using your current server
# (You'll need to add the monitoring middleware manually)
```

### 3. Access Monitoring Dashboard

Open in browser:
- **Dashboard**: http://localhost:3000/status
- **Health Check**: http://localhost:3000/health
- **Metrics**: http://localhost:3000/metrics

### 4. Run Baseline Tests

```powershell
cd benchmark

# Run all tests automatically
node run-benchmarks.js

# Or run individual tests:
node race-condition-test.js
npx artillery run load-test.yml
k6 run load-test.js
```

### 5. Analyze Bottlenecks

After running tests and generating traffic:

```powershell
node analyze-bottlenecks.js
```

## 📊 What Gets Measured

### Request Metrics
- Response time (average, p50, p95, p99, max)
- Requests per second (throughput)
- Error rate
- Slow requests (>1s)
- Memory usage per request

### Database Metrics
- Query execution time
- Slow queries (>100ms)
- Query type breakdown (SELECT, INSERT, UPDATE)
- N+1 query detection

### Bottleneck Detection
- Critical endpoints (>1s)
- Slow endpoints (>500ms)
- Slow database queries
- Potential N+1 queries
- Race conditions

## ⚠️ **Why Realistic Data Matters**

**Empty database = Unrealistic results!**

Your 5.91ms average with empty DB will become:
- **With 50 rooms**: 20-50ms
- **With 500 bookings**: 50-150ms
- **With complex searches**: 100-300ms

**Always seed data before benchmarking:**
```powershell
npm run seed  # Creates realistic test data
npm run benchmark  # Now tests with real load
```

## 🔄 Workflow for Testing Improvements

### Before Making Changes:

```powershell
# 1. Start server
node index-monitored.js

# 2. Run baseline tests (in new terminal)
cd benchmark
node run-benchmarks.js

# 3. This creates baseline-metrics.json
```

### After Making Changes:

```powershell
# 1. Restart server with changes
node index-monitored.js

# 2. Run tests again
cd benchmark
node run-benchmarks.js

# 3. Compare results automatically
# The script will show % improvement vs baseline
```

### Analyze Issues:

```powershell
# Run bottleneck analysis
node analyze-bottlenecks.js

# Check database query performance
# Results in: results/bottleneck-report-*.json
```

## 📈 Understanding Results

### Load Test Results (k6)

```
http_req_duration........: avg=250ms p(95)=450ms p(99)=800ms
```
- **avg**: Average response time
- **p(95)**: 95% of requests faster than this
- **p(99)**: 99% of requests faster than this

**Good targets:**
- avg < 200ms
- p(95) < 500ms
- p(99) < 1000ms

### Artillery Results

HTML report shows:
- Request rate over time
- Response time distribution
- Error rate
- Status code distribution

Open: `results/artillery-report.html`

### Race Condition Test

**Before fix:**
```
Successful: 10  ❌ (Multiple bookings created - BUG!)
```

**After fix:**
```
Successful: 1  ✅ (Only one booking - Correct!)
```

## 🎯 Expected Performance Improvements

Based on the architectural issues found:

| Fix | Expected Improvement |
|-----|---------------------|
| Remove 1s delay | **~1000ms → 50ms (95%)** |
| Add DB indexes | **~500ms → 50ms (90%)** |
| Connection pooling | **No timeouts under load** |
| Race condition fix | **0% double bookings** |
| Redis rate limiting | **Better concurrency** |

## 🔍 Monitoring Dashboard Features

Real-time monitoring at `/status`:

- **CPU Usage** - Server CPU utilization
- **Memory** - Heap and RSS memory
- **Response Time** - Request latency graph
- **Requests/sec** - Throughput chart
- **Status Codes** - Success/error breakdown

## 📝 Test Scenarios

### Load Test Scenarios
1. **Get All Rooms** (40% of traffic) - Tests caching
2. **Get Room Details** (25%) - Tests DB queries with joins
3. **Search Rooms** (20%) - Tests complex queries
4. **Get Bookings** (10%) - Tests list endpoints
5. **Create Booking** (5%) - Tests write operations & race conditions

### Load Phases
1. **Warm up** (30s, 5 users/s) - Prime caches
2. **Normal load** (60s, 20 users/s) - Typical usage
3. **High load** (60s, 50 users/s) - Peak traffic
4. **Spike** (30s, 100 users/s) - Stress test
5. **Cool down** (30s, 5 users/s) - Recovery

## 🛠️ Troubleshooting

### "Server not running" error
```powershell
# Make sure server is started first
node index-monitored.js

# Then run tests in another terminal
```

### "k6 not found" or "artillery not found"
```powershell
# Install globally
npm install -g k6
npm install -g artillery

# Or run without them (script will skip)
```

### "No performance data available"
```powershell
# Generate some traffic first
node run-benchmarks.js

# Then analyze
node analyze-bottlenecks.js
```

## 📦 Results Directory Structure

```
benchmark/
  results/
    baseline-metrics.json          # Your baseline
    benchmark-report-*.json        # Test comparisons
    bottleneck-report-*.json       # Bottleneck analysis
    k6-results.json               # k6 raw data
    artillery-results.json         # Artillery raw data
    artillery-report.html          # Artillery visual report
```

## 💡 Tips

1. **Always establish baseline first** before making changes
2. **Run tests 3 times** and use average for comparison
3. **Generate realistic load** that matches production patterns
4. **Check dashboard during tests** to see real-time impact
5. **Use analyze-bottlenecks.js** to find the biggest issues
6. **Focus on p95/p99** not just averages

## 🎓 Next Steps

1. Run baseline tests now
2. Review bottleneck report
3. Fix P0 issues (remove 1s delay, add indexes)
4. Run tests again
5. Compare improvements
6. Repeat for P1/P2 fixes

## 📞 Support

If you see unexpected results:
1. Check server logs for errors
2. Verify database connection
3. Check Redis is running (if used)
4. Review monitoring dashboard during tests
5. Examine bottleneck-report JSON files

---

**Ready to start?**

```powershell
# Install and go!
npm install express-status-monitor
node index-monitored.js

# In another terminal:
cd benchmark
node run-benchmarks.js
```
