import redis from 'redis';
import {env} from './environment.js';
const redisClient = redis.createClient({
  url: `redis://127.0.0.1:${env.REDIS_PORT}`
});

redisClient.on('error', (err) => console.error(' Redis error:', err));
(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis');
  } catch (err) {
    console.error('Redis connection failed:', err);
  }
})();

export default redisClient;