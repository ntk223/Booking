import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const roomListTrend = new Trend('room_list_duration');
const roomDetailsTrend = new Trend('room_details_duration');
const searchTrend = new Trend('room_search_duration');
const bookingCreateTrend = new Trend('booking_create_duration');
const bookingListTrend = new Trend('booking_list_duration');
const slowQueries = new Counter('slow_queries_over_1s');
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm up
    { duration: '1m', target: 30 },    // Normal load
    { duration: '1m', target: 60 },    // High load
    { duration: '30s', target: 100 },  // Spike
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],  // Less than 1% errors
    'errors': ['rate<0.01'],
    'room_list_duration': ['p(95)<300'],
    'room_search_duration': ['p(95)<800'],
    'booking_create_duration': ['p(95)<600'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  let response;
  let roomId;

  // Test 1: Get all rooms (should be cached)
  group('Get All Rooms', () => {
    response = http.get(`${BASE_URL}/api/room`);
    roomListTrend.add(response.timings.duration);
    
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'has rooms array': (r) => Array.isArray(JSON.parse(r.body)),
      'response time < 1s': (r) => r.timings.duration < 1000,
      'response time < 300ms': (r) => r.timings.duration < 300,
    });

    if (!success) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    if (response.timings.duration > 1000) {
      slowQueries.add(1);
    }

    // Try to get roomId for next test
    if (response.status === 200) {
      const rooms = JSON.parse(response.body);
      if (rooms.length > 0) {
        roomId = rooms[0].id;
      }
    }
  });

  sleep(1);

  // Test 2: Get specific room details
  if (roomId) {
    group('Get Room Details', () => {
      response = http.get(`${BASE_URL}/api/room/${roomId}`);
      roomDetailsTrend.add(response.timings.duration);
      
      check(response, {
        'status is 200': (r) => r.status === 200,
        'has room data': (r) => r.body.length > 0,
      });

      if (response.timings.duration > 1000) {
        slowQueries.add(1);
      }
    });
  }

  sleep(1);

  // Test 3: Search rooms (complex query with joins)
  group('Search Available Rooms', () => {
    const searchPayload = JSON.stringify({
      capacity: Math.floor(Math.random() * 50) + 10,
      districtId: Math.floor(Math.random() * 3) + 1,
      searchDate: '2025-11-25',
      startTime: `${9 + Math.floor(Math.random() * 8)}:00`,
      endTime: `${11 + Math.floor(Math.random() * 8)}:00`,
    });

    response = http.post(`${BASE_URL}/api/room/search`, searchPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    searchTrend.add(response.timings.duration);
    
    check(response, {
      'status is 200': (r) => r.status === 200,
      'returns array': (r) => Array.isArray(JSON.parse(r.body)),
      'response time < 2s': (r) => r.timings.duration < 2000,
    });

    if (response.timings.duration > 1000) {
      slowQueries.add(1);
    }
  });

  sleep(1);

  // Test 4: Get all bookings
  group('Get All Bookings', () => {
    response = http.get(`${BASE_URL}/api/booking`);
    bookingListTrend.add(response.timings.duration);
    
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (response.timings.duration > 1000) {
      slowQueries.add(1);
    }
  });

  sleep(1);

  // Test 5: Create booking (write operation - test race condition)
  group('Create Booking', () => {
    const bookingPayload = JSON.stringify({
      roomId: Math.floor(Math.random() * 50) + 1267,  // Random room from 1267-1316
      userId: Math.floor(Math.random() * 100) + 504,  // Random user from 504-603
      date: `2025-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      startTime: `${9 + Math.floor(Math.random() * 8)}:00`,
      endTime: `${11 + Math.floor(Math.random() * 8)}:00`,
      purpose: 'Load test booking',
    });

    response = http.post(`${BASE_URL}/api/booking`, bookingPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    bookingCreateTrend.add(response.timings.duration);
    
    check(response, {
      'status is 201 or conflict': (r) => r.status === 201 || r.status === 500,
      'response time < 1s': (r) => r.timings.duration < 1000,
    });

    if (response.timings.duration > 1000) {
      slowQueries.add(1);
    }
  });

  sleep(2);
}

// Summary handler
export function handleSummary(data) {
  console.log('\n========================================');
  console.log('         PERFORMANCE TEST SUMMARY       ');
  console.log('========================================\n');
  
  const metrics = data.metrics;
  
  console.log('📊 Response Times:');
  console.log(`   Average: ${metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`   p(50): ${metrics.http_req_duration.values['p(50)'].toFixed(2)}ms`);
  console.log(`   p(95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`   p(99): ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`   Max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n`);

  console.log('🎯 Throughput:');
  console.log(`   Total Requests: ${metrics.http_reqs.values.count}`);
  console.log(`   Requests/sec: ${metrics.http_reqs.values.rate.toFixed(2)}\n`);

  console.log('❌ Errors:');
  console.log(`   Failed Requests: ${metrics.http_req_failed.values.passes || 0}`);
  console.log(`   Error Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n`);

  console.log('🔍 Endpoint Performance:');
  console.log(`   Room List p(95): ${metrics.room_list_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`   Room Details p(95): ${metrics.room_details_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`   Room Search p(95): ${metrics.room_search_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`   Booking Create p(95): ${metrics.booking_create_duration.values['p(95)'].toFixed(2)}ms\n`);

  console.log('⚠️  Bottlenecks:');
  console.log(`   Slow Queries (>1s): ${metrics.slow_queries_over_1s.values.count}\n`);

  console.log('========================================\n');

  return {
    'stdout': '',
    'summary.json': JSON.stringify(data, null, 2),
  };
}
