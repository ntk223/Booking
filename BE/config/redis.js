const redis = require('redis');
const dotenv = require('dotenv');
dotenv.config();
const client = redis.createClient({
  url: `redis://127.0.0.1:${process.env.REDIS_PORT}`
});

client.on('error', (err) => console.error(' Redis error:', err));

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to Redis');
  } catch (err) {
    console.error('Redis connection failed:', err);
  }
})();

module.exports = client;
