import safeRedisClient from "../config/redis.js";
import crypto from 'crypto';

const GLOBAL_CAPACITY = 5000;
const GLOBAL_REFILL_RATE = 100;

const createBucket = async (key, capacity, now, ttl = 3600) => {
  const bucket = { tokens: capacity - 1, lastRefill: now };
  await safeRedisClient.set(key, JSON.stringify(bucket), { EX: ttl });
  return bucket;
};

const updateBucket = (bucket, capacity, refillRate, now) => {
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;
  return bucket;
};

const consumeToken = (bucket) => {
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
};

const rateLimitMiddleware = ({ capacity = 100, refillRate = 10 } = {}) => {
  return async (req, res, next) => {
    try {
      const now = Date.now();

      // Determine key: userID → IP
      const key = req.user?.id
        ? `user:${req.user.id}`
        : `ip:${req.ip}`;

      const redisKey = `ratelimit:${key}`;
      const globalKey = "ratelimit:global";

      // ---- GLOBAL LIMIT ----
      let gData = await safeRedisClient.get(globalKey);
      let globalBucket;

      if (!gData) {
        globalBucket = await createBucket(globalKey, GLOBAL_CAPACITY, now);
      } else {
        globalBucket = updateBucket(JSON.parse(gData), GLOBAL_CAPACITY, GLOBAL_REFILL_RATE, now);
        if (!consumeToken(globalBucket)) {
          const retryAfter = Math.ceil((1 - globalBucket.tokens) / GLOBAL_REFILL_RATE);
          res.set("Retry-After", retryAfter);
          return res.status(429).json({
            success: false,
            message: "Too Many Requests - Global Rate Limit",
            retryAfterSeconds: retryAfter
          });
        }
        safeRedisClient.set(globalKey, JSON.stringify(globalBucket), { EX: 3600 });
      }

      // ---- LOCAL LIMIT ----
      let data = await safeRedisClient.get(redisKey);
      let bucket;

      if (!data) {
        bucket = await createBucket(redisKey, capacity, now);
        return next();
      }

      bucket = updateBucket(JSON.parse(data), capacity, refillRate, now);

      if (!consumeToken(bucket)) {
        const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate);
        res.set("Retry-After", retryAfter);
        return res.status(429).json({
          success: false,
          message: "Too Many Requests",
          retryAfterSeconds: retryAfter
        });
      }

      safeRedisClient.set(redisKey, JSON.stringify(bucket), { EX: 3600 });
      next();

    } catch (err) {
      console.error("RateLimit error:", err);
      next();
    }
  };
};

export default rateLimitMiddleware;
