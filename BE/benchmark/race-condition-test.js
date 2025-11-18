/**
 * Race Condition Test for Concurrent Booking Creation
 * 
 * This test simulates multiple users trying to book the same room
 * at the same time to detect race conditions.
 * 
 * Expected behavior BEFORE fix: Multiple bookings succeed (BUG!)
 * Expected behavior AFTER fix: Only one booking succeeds
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testRaceCondition() {
  console.log(' Testing Race Condition in Booking Creation\n');
  console.log('================================================\n');

  // Use same booking data for all concurrent requests
  const bookingData = {
    roomId: 1267,  // Using actual room ID from database
    userId: 504,   // Using actual user ID from database
    date: '2025-12-15',
    startTime: '14:00',
    endTime: '16:00',
    purpose: 'Race condition test'
  };

  console.log('[INFO] Test Setup:');
  console.log(`   Room ID: ${bookingData.roomId}`);
  console.log(`   Date: ${bookingData.date}`);
  console.log(`   Time: ${bookingData.startTime} - ${bookingData.endTime}`);
  console.log(`   Concurrent Requests: 10\n`);

  // Create 10 concurrent requests with the SAME booking data
  const requests = Array(10).fill(null).map((_, index) => 
    fetch(`${BASE_URL}/api/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...bookingData,
        purpose: `Race condition test #${index + 1}`
      }),
    }).then(async response => ({
      index: index + 1,
      status: response.status,
      body: await response.json().catch(() => ({})),
      success: response.status === 201
    })).catch(error => ({
      index: index + 1,
      status: 0,
      error: error.message,
      success: false
    }))
  );

  console.log(' Sending 10 concurrent booking requests...\n');
  
  const start = Date.now();
  const results = await Promise.all(requests);
  const duration = Date.now() - start;

  console.log(' Results:\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  results.forEach(result => {
    const icon = result.success ? '' : '';
    console.log(`   ${icon} Request #${result.index}: HTTP ${result.status}`);
  });

  console.log('\n================================================\n');
  console.log(' Summary:');
  console.log(`   Total Duration: ${duration}ms`);
  console.log(`   Successful: ${successful.length}`);
  console.log(`   Failed: ${failed.length}\n`);

  console.log(' Analysis:');
  if (successful.length > 1) {
    console.log('     RACE CONDITION DETECTED!');
    console.log('   Multiple bookings created for the same time slot.');
    console.log('   This indicates a critical bug in booking creation.\n');
    console.log('   Expected: 1 success, 9 failures');
    console.log(`   Actual: ${successful.length} successes, ${failed.length} failures\n`);
    return false;
  } else if (successful.length === 1) {
    console.log('    RACE CONDITION PROTECTED!');
    console.log('   Only one booking succeeded as expected.');
    console.log('   Transaction isolation is working correctly.\n');
    return true;
  } else {
    console.log('     UNEXPECTED RESULT!');
    console.log('   No bookings succeeded. Check if server is running.\n');
    return null;
  }
}

// Test concurrent requests to different time slots (should all succeed)
async function testNonConflictingBookings() {
  console.log('\n Testing Non-Conflicting Concurrent Bookings\n');
  console.log('================================================\n');

  const requests = Array(10).fill(null).map((_, index) => 
    fetch(`${BASE_URL}/api/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: 1267,  // Using actual room ID from database
        userId: 504,   // Using actual user ID from database
        date: '2025-12-20',
        startTime: `${9 + index}:00`,
        endTime: `${10 + index}:00`,
        purpose: `Non-conflicting test #${index + 1}`
      }),
    }).then(async response => ({
      index: index + 1,
      status: response.status,
      success: response.status === 201
    }))
  );

  console.log(' Sending 10 non-conflicting booking requests...\n');
  
  const results = await Promise.all(requests);
  const successful = results.filter(r => r.success);

  console.log(' Results:');
  console.log(`   Successful: ${successful.length}/10`);
  
  if (successful.length === 10) {
    console.log('    All non-conflicting bookings succeeded!\n');
    return true;
  } else {
    console.log('     Some non-conflicting bookings failed!\n');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n===============================================');
  console.log('|   RACE CONDITION & CONCURRENCY TEST SUITE    |');
  console.log('===============================================\n');

  try {
    const test1 = await testRaceCondition();
    const test2 = await testNonConflictingBookings();

    console.log('\n================================================');
    console.log('           FINAL TEST RESULTS');
    console.log('================================================\n');
    console.log(`Race Condition Test: ${test1 === true ? ' PASS' : test1 === false ? ' FAIL' : '  UNKNOWN'}`);
    console.log(`Non-Conflicting Test: ${test2 ? ' PASS' : ' FAIL'}\n`);

    if (test1 === false) {
      console.log('  CRITICAL: Race condition vulnerability detected!');
      console.log('   Implement database transactions with row locking.\n');
      process.exit(1);
    } else if (test1 === true && test2) {
      console.log(' All tests passed! System is handling concurrency correctly.\n');
      process.exit(0);
    }
  } catch (error) {
    console.error(' Test Error:', error.message);
    process.exit(1);
  }
}

runAllTests();


