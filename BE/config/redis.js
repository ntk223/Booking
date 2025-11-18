import redis from 'redis';
import {env} from './environment.js';

const redisClient = redis.createClient({
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('[ERROR] Redis max retries exceeded');
        return new Error('Redis max retries exceeded');
      }
      return Math.min(retries * 50, 500);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('[ERROR] Redis error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[INFO] Connecting to Redis...');
});

redisClient.on('ready', () => {
  console.log('[INFO] Redis client ready');
  console.log(`   Host: ${env.REDIS_HOST}:${env.REDIS_PORT}\n`);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('[ERROR] Redis connection failed:', err.message);
    console.warn('[WARNING] Redis is not available. Caching will be disabled.');
  }
})();

export default redisClient;