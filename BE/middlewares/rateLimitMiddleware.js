const rateLimitMap = new Map(); // key = client IP

function rateLimit({ capacity = 10, refillRate = 1 }) {
  // refillRate: token/second
  return (req, res, next) => {
    const key = req.ip; // hoặc req.headers['authorization'] nếu theo token
    const now = Date.now();

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, {
        tokens: capacity - 1,
        lastRefill: now,
      });
      return next();
    }

    const bucket = rateLimitMap.get(key);
    // refill token
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return next();
    } else {
      res.status(429).json({ message: "Too Many Requests" });
    }
  };
}

export default rateLimit;