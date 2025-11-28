import safeRedisClient from "../config/redis.js";
import crypto from 'crypto';

/**
 * Tạo hash nhanh bằng SHA256 (Nhanh gấp nghìn lần bcrypt)
 */
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
}

const rateLimitMiddleware = ({ capacity = 100, refillRate = 10 } = {}) => {
  return async (req, res, next) => {
    try {
      let key = 'ip:' + req.ip; // Mặc định dùng IP

      // Ưu tiên 1: Dùng User ID nếu đã login (Nhanh nhất, chính xác nhất)
      if (req.user?.id) {
        key = `user:${req.user.id}`;
      } 
      // Ưu tiên 2: Dùng Email hash nếu đang login form (Ẩn danh tính)
      else if (req.body?.email) {
        key = `email:${hashString(req.body.email)}`;
      }
      
      const redisKey = `ratelimit:${key}`;
      const now = Date.now();

      // --- Tối ưu Redis Transaction (Tránh Race Condition) ---
      // Lấy bucket và update trong cùng 1 logic nếu có thể, 
      // hoặc dùng logic get/set như cũ nhưng chấp nhận sai số nhỏ.
      
      const bucketData = await safeRedisClient.get(redisKey);
      let bucket;

      if (!bucketData) {
        bucket = { tokens: capacity - 1, lastRefill: now };
        await safeRedisClient.set(redisKey, JSON.stringify(bucket), { EX: 3600 });
        return next();
      }

      bucket = JSON.parse(bucketData);
      
      // Tính toán refill
      const elapsed = (now - bucket.lastRefill) / 1000;
      // Refill không được vượt quá capacity
      bucket.tokens = Math.min(capacity, bucket.tokens + (elapsed * refillRate));
      bucket.lastRefill = now;

      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        // Set lại vào Redis (Không cần await để giảm latency response cho user)
        safeRedisClient.set(redisKey, JSON.stringify(bucket), { EX: 3600 });
        return next();
      }

      // Bị chặn
      const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate);
      res.set("Retry-After", retryAfter);
      return res.status(429).json({
        success: false,
        message: "Too Many Requests",
        retryAfterSeconds: retryAfter
      });

    } catch (err) {
      console.error("RateLimit error:", err);
      return next();
    }
  };
};

export default rateLimitMiddleware;