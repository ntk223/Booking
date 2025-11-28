import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Counter } from 'k6/metrics';

// ---------------- CẤU HÌNH ----------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const TEST_USER = {
    email: 'michele.wilderman@yahoo.com',
    password: 'ouoAiN6NID1hDql'
};
const TEST_USERS = [
    { email: 'michele.wilderman@yahoo.com', password: 'ouoAiN6NID1hDql' },
    { email: 'susanna.schultz9@yahoo.com', password: 'MdLVtR9thrgTRYz' },
    { email: 'hardy.schoen54@yahoo.com', password: 'IIwFufjT_UwuGw0' },
    { email: 'may.walsh20@gmail.com', password: 'aXGdy8n4iOMsaej' },
    { email: 'dessie7@hotmail.com', password: 'f5Hg9ndsOXP5sL3' },
    { email: 'zack.herzog45@gmail.com', password: 'EwMSDEBqqSsPYjV' },
    { email: 'marjolaine24@hotmail.com', password: 'sIDERLZH_hLji8L' },
    { email: 'cielo.lynch@gmail.com', password: 'USq8Jc3nRF4gnE9' },
    { email: 'valentina13@yahoo.com', password: 'iJ8liIwJwjvYJuw' },
    { email: 'wanda88@yahoo.com', password: 'o9Q_iQOGR8yeccD' },

];
// Metrics
const loginRateLimitedCount = new Counter('login_rate_limited_count');
const apiRateLimitedCount = new Counter('api_rate_limited_count');

export const options = {
    scenarios: {
        // ------------------------------------------------------------------
        // Scenario 1: Login Test (Kiểm tra Rate Limiting cho Login)
        // Mục tiêu: Test rate limiting cho login endpoint
        // Kỳ vọng: Một số request bị rate limit (429)
        // ------------------------------------------------------------------
        login_test: {
            executor: 'per-vu-iterations',
            vus: 3,             // Giảm xuống 3 VUs
            iterations: 5,      // Mỗi VU 5 iterations = 15 total
            maxDuration: '20s',
            startTime: '0s',
            tags: { test_type: 'login' },
        },

        // ------------------------------------------------------------------
        // Scenario 2: API Burst Test (Test tải đột ngột)
        // Mục tiêu: Test API với tải burst cao
        // Kỳ vọng: Một phần request thành công, một phần bị rate limit
        // ------------------------------------------------------------------
        api_burst_test: {
            executor: 'shared-iterations',
            vus: 5,             // 5 VUs
            iterations: 25,     // 25 total requests
            maxDuration: '40s',
            startTime: '35s',   // Chạy sau login test
            tags: { test_type: 'api_burst' },
        },

        // ------------------------------------------------------------------
        // Scenario 3: API Sustained Test (Test tải liên tục)
        // Mục tiêu: Test API với tải liên tục ổn định
        // Kỳ vọng: Tỷ lệ thành công cao, ít rate limiting
        // ------------------------------------------------------------------
        api_sustained_test: {
            executor: 'constant-arrival-rate',
            rate: 3,            // Giảm xuống 3 req/s
            timeUnit: '1s',
            duration: '20s',    // Giảm duration
            preAllocatedVUs: 3,
            maxVUs: 10,
            startTime: '1m20s',
            tags: { test_type: 'api_sustained' },
        },

        // ------------------------------------------------------------------
        // Scenario 4: API Spike Test (Test spike cao)
        // Mục tiêu: Test khả năng chịu tải spike
        // Kỳ vọng: Server ổn định, rate limiting hoạt động
        // ------------------------------------------------------------------
        api_spike_test: {
            executor: 'ramping-arrival-rate',
            startRate: 1,
            timeUnit: '1s',
            preAllocatedVUs: 5,
            maxVUs: 15,
            stages: [
                { duration: '10s', target: 10 }, // Tăng lên 10 req/s
                { duration: '15s', target: 10 }, // Giữ ổn định
                { duration: '5s', target: 1 },   // Giảm xuống
            ],
            startTime: '2m',
            tags: { test_type: 'api_spike' },
        }
    },
    
    thresholds: {
        'http_req_duration': ['p(95)<3000'], // 95% requests dưới 3s
        'login_rate_limited_count': ['count>=0'], // Cho phép 0 hoặc nhiều hơn
        'api_rate_limited_count': ['count>=0'], // Cho phép 0 hoặc nhiều hơn
        'http_req_failed{test_type:login}': ['rate<0.9'], // <90% login failures
        'http_req_failed{test_type:api_burst}': ['rate<0.7'], // <70% API failures
        'http_req_failed{test_type:api_sustained}': ['rate<0.3'], // <30% sustained failures
        'http_req_failed{test_type:api_spike}': ['rate<0.8'], // <80% spike failures
    },
};

// Test users pool


// ---------------- SETUP ----------------
export function setup() {
    console.log(`\n🔧 [SETUP] Initializing test data from ${BASE_URL}...`);
    console.log(`👥 [SETUP] Creating individual tokens for ${TEST_USERS.length} users`);
    
    const userTokens = {};
    let validTokenCount = 0;
    
    // Tạo token cho từng user
    for (let i = 0; i < TEST_USERS.length; i++) {
        const user = TEST_USERS[i];
        console.log(`🔑 [SETUP] Attempting login for user: ${user.email}`);
        
        const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), {
            headers: { 'Content-Type': 'application/json' },
        });

        if (res.status === 200) {
            try {
                const body = JSON.parse(res.body);
                const token = body.accessToken || body.token || body.jwt;
                if (token) {
                    userTokens[user.email] = token;
                    validTokenCount++;
                    console.log(`   ✅ Got token:`, token);
                } else {
                    console.log(`   ❌ No token in response`);
                    userTokens[user.email] = `mock.token.${i}`;
                }
            } catch (e) {
                console.log(`   ❌ Parse error: ${e.message}`);
                userTokens[user.email] = `mock.token.${i}`;
            }
        } else {
            console.log(`   ❌ Login failed (${res.status}): ${res.body}`);
            userTokens[user.email] = `mock.token.${i}`;
        }
        
        sleep(0.1); // Tránh spam server
    }
    
    console.log(`📊 [SETUP] Summary: ${validTokenCount}/${TEST_USERS.length} users got valid tokens`);
    
    return { 
        userTokens: userTokens,
        users: TEST_USERS,
        validTokenCount: validTokenCount
    };
}

// =============================================
// TEST FUNCTIONS (mapped to scenario names)
// =============================================

// Test login endpoint với multiple users (mapped to login_test scenario)
export function login_test(data) {
    const tag = '🔐 [LOGIN-TEST]';
    // Mỗi VU sử dụng user cố định dựa trên VU ID
    const userIndex = (__VU - 1) % data.users.length;
    const testUser = data.users[userIndex];
    
    console.log(`${tag} VU ${__VU} testing login with user: ${testUser.email}`);
    
    const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(testUser), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
        'Login response time < 3s': (r) => r.timings.duration < 3000,
        'Login status is 200, 401, or 429': (r) => [200, 401, 429].includes(r.status),
        'Rate limit triggered (429)': (r) => r.status === 429,
        'Valid login (200)': (r) => r.status === 200,
        'Invalid credentials (401)': (r) => r.status === 401,
    });

    if (res.status === 429) {
        console.log(`${tag} VU ${__VU} ⛔ Rate limited! Response: ${res.body}`);
        loginRateLimitedCount.add(1);
    } else if (res.status === 200) {
        console.log(`${tag} VU ${__VU} ✅ Login successful`);
    } else if (res.status === 401) {
        console.log(`${tag} VU ${__VU} 🔒 Invalid credentials (expected for test users)`);
    } else {
        console.log(`${tag} VU ${__VU} ❌ Unexpected status: ${res.status}`);
    }

    sleep(0.1 + Math.random() * 0.2); // Random delay between 0.1-0.3s
}

// Test API bursts với concurrent requests
export function api_burst_test(data) {
    const tag = '🚀 [API-BURST]';
    // Mỗi VU sử dụng user và token riêng
    const userIndex = (__VU - 1) % data.users.length;
    const testUser = data.users[userIndex];
    const userToken = data.userTokens[testUser.email];
    
    console.log(`${tag} VU ${__VU} testing API burst with user: ${testUser.email}`);
    
    // Gửi concurrent requests từ mỗi VU
    const requests = [];
    for (let i = 0; i < 3; i++) { // Mỗi VU gửi 3 requests đồng thời
        requests.push({
            method: 'GET',
            url: `${BASE_URL}/api/room?page=${i + 1}`,
            params: {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            }
        });
    }

    const responses = http.batch(requests);
    
    responses.forEach((res, index) => {
        check(res, {
            'API response time < 3s': (r) => r.timings.duration < 3000,
            'API status is 200 or 429': (r) => r.status === 200 || r.status === 429,
        });

        if (res.status === 429) {
            console.log(`${tag} VU ${__VU} req#${index + 1} ⛔ Rate limited`);
            apiRateLimitedCount.add(1);
        } else if (res.status === 200) {
            console.log(`${tag} VU ${__VU} req#${index + 1} ✅ Success`);
        } else {
            console.log(`${tag} VU ${__VU} req#${index + 1} ❌ Error: ${res.status} - ${res.body}`);
            console.log(`${tag} VU ${__VU} req#${index + 1} Token: ${userToken ? userToken.substring(0, 20) : 'null'}...`);
        }
    });

    sleep(0.5);
}

// Test sustained API load
export function api_sustained_test(data) {
    const tag = '⏱️ [API-SUSTAINED]';
    // Mỗi VU sử dụng user và token riêng
    const userIndex = (__VU - 1) % data.users.length;
    const testUser = data.users[userIndex];
    const userToken = data.userTokens[testUser.email];
    
    console.log(`${tag} VU ${__VU} sustained test with user: ${testUser.email}`);
    
    const res = http.get(`${BASE_URL}/api/room?page=${Math.floor(Math.random() * 3) + 1}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        }
    });

    check(res, {
        'Sustained API response time < 3s': (r) => r.timings.duration < 3000,
        'Sustained API status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    });

    if (res.status === 429) {
        console.log(`${tag} VU ${__VU} ⛔ Rate limited`);
        apiRateLimitedCount.add(1);
    } else if (res.status === 200) {
        console.log(`${tag} VU ${__VU} ✅ Success`);
    } else {
        console.log(`${tag} VU ${__VU} ❌ Error: ${res.status}`);
    }

    sleep(1);
}

// Test API spike load
export function api_spike_test(data) {
    const tag = '📈 [API-SPIKE]';
    // Mỗi VU sử dụng user và token riêng
    const userIndex = (__VU - 1) % data.users.length;
    const testUser = data.users[userIndex];
    const userToken = data.userTokens[testUser.email];
    
    console.log(`${tag} VU ${__VU} spike test with user: ${testUser.email}`);
    
    // Trong spike test, gửi requests nhanh hơn
    const res = http.get(`${BASE_URL}/api/room?page=${Math.floor(Math.random() * 10) + 1}`, {
        headers: {
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${userToken}`
        }
    });

    check(res, {
        'Spike API response time < 5s': (r) => r.timings.duration < 5000,
        'Spike API status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    });

    if (res.status === 429) {
        console.log(`${tag} VU ${__VU} ⛔ Rate limited`);
        apiRateLimitedCount.add(1);
    } else if (res.status === 200) {
        console.log(`${tag} VU ${__VU} ✅ Success`);
    } else {
        console.log(`${tag} VU ${__VU} ❌ Error: ${res.status}`);
    }

    sleep(0.2);
}

// ---------------- LEGACY TEST (kept for compatibility) ----------------
export default function (data) {
    // Kiểm tra nếu setup thất bại thì dừng luôn
    if (!data || !data.userTokens) {
        fail('⛔ Test aborted: No user tokens from setup.');
    }
    
    // Sử dụng token của user đầu tiên cho legacy test
    const userIndex = (__VU - 1) % data.users.length;
    const currentUser = data.users[userIndex];
    const token = data.userTokens[currentUser.email];

    console.log(`🔄 [LEGACY] Using token for user: ${currentUser.email}`);

    

    // --- TEST 1: LOGIN RATE LIMITING (Sequential) ---
    group('🔐 Test Login Rate Limit', () => {
        console.log('\n================================================');
        console.log('🔐 TESTING LOGIN RATE LIMITING (Sequential)');
        
        const wrongPayload = JSON.stringify({
            email: TEST_USER.email,
            password: 'wrongpassword_intentionally' 
        });
        
        const params = { headers: { 'Content-Type': 'application/json' } };
        let rateLimitHit = false;

        // Gửi 3 request liên tiếp để test rate limiting
        for (let i = 1; i <= 3; i++) {
            const res = http.post(`${BASE_URL}/api/auth/login`, wrongPayload, params);
            
            if (res.status === 429) {
                rateLimitHit = true;
                loginRateLimitedCount.add(1);
                console.log(`   Request #${i}: ⛔ RATE LIMITED (HTTP 429)`);
            } else if (res.status === 401 || res.status === 400) {
                console.log(`   Request #${i}: 🔐 Blocked by Auth (HTTP ${res.status}) - OK`);
            } else {
                console.log(`   Request #${i}: ⚠️ Unexpected Status (HTTP ${res.status})`);
            }
            
            sleep(0.1); 
        }

        check(rateLimitHit, {
            'Login rate limit triggered': (triggered) => triggered === true,
        });
    });

    sleep(2); 

    // --- TEST 2: API RATE LIMITING (Parallel/Batch) ---
    group('🌐 Test API Rate Limit', () => {
        console.log('\n================================================');
        console.log('🌐 TESTING API RATE LIMITING (Concurrent)');

        // Chuẩn bị batch request
        const requests = [];
        const params = { 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            } 
        };

        // Tạo 3 request để gửi ĐỒNG THỜI
        for (let i = 0; i < 3; i++) {
            requests.push({
                method: 'GET',
                url: `${BASE_URL}/api/room?page=1`,
                params: params
            });
        }

        console.log(`🚀 Sending ${requests.length} concurrent requests...`);
        
        // http.batch gửi tất cả request cùng lúc
        const responses = http.batch(requests);
        
        let successCount = 0;
        let rateLimitCount = 0;

        responses.forEach((res, index) => {
            if (res.status === 429) {
                rateLimitCount++;
                apiRateLimitedCount.add(1);
                console.log(`   Request #${index + 1}: ⛔ RATE LIMITED (HTTP 429)`);
            } else if (res.status === 200) {
                successCount++;
                console.log(`   Request #${index + 1}: ✅ Success (HTTP 200)`);
            } else {
                console.log(`   Request #${index + 1}: ❌ Failed (HTTP ${res.status})`);
            }
        });

        console.log(`\n📊 API Summary: Success=${successCount}, Blocked=${rateLimitCount}`);

        check(rateLimitCount, {
            'API rate limit triggered': (count) => count > 0,
        });
    });
}