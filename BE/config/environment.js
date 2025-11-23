import 'dotenv/config'


export const env = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASS: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'booking_db',
    DB_PORT: process.env.DB_PORT || 3306,
    APP_PORT: process.env.APP_PORT || 3000,
    // JWT_SECRET: process.env.JWT_SECRET,
    // JWT_EXPIRE: process.env.JWT_EXPIRE,
    // REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    // REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE,
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
    // CACHE_EXPIRATION: process.env.CACHE_EXPIRATION,
    
    // Circuit Breaker Configuration
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: parseFloat(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 0.5,  // 50% error rate
    CIRCUIT_BREAKER_WINDOW_SIZE: parseInt(process.env.CIRCUIT_BREAKER_WINDOW_SIZE) || 20,                 // 20 requests
    CIRCUIT_BREAKER_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 30000,                      // 30 seconds
    CIRCUIT_BREAKER_SUCCESS_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD) || 2,      // 2 successes
}