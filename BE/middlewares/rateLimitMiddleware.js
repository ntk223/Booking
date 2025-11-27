const rateLimitMap = new Map();

/**
 * Middleware Token Bucket Rate Limit
 * @param {Object} options
 * @param {number} options.capacity - Dung lượng tối đa của xô (số request tối đa được burst).
 * @param {number} options.refillRate - Tốc độ hồi token (token/giây).
 */
const rateLimitMiddleware = ({ capacity = 100, refillRate = 10 } = {}) => {

  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((bucket, key) => {
      // Tính toán xem bucket đã đầy chưa
      const elapsed = (now - bucket.lastRefill) / 1000;
      const currentTokens = Math.min(capacity, bucket.tokens + elapsed * refillRate);
      
      // Nếu token đã hồi đầy, nghĩa là user đã "nghỉ" lâu -> Xóa khỏi bộ nhớ
      if (currentTokens >= capacity) {
        rateLimitMap.delete(key);
      }
    });
  }, 5 * 60 * 1000); // 5 phút

  // --- LOGIC CHÍNH ---
  return (req, res, next) => {
    // 1. Xác định Key (Mặc định là IP, có thể đổi thành user ID)
    let key = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user = req.user;
    if (user && user.id) {
      key = `user-${user.id}`;
    }
    const now = Date.now();

    // 2. Nếu là user mới (chưa có trong Map)
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, {
        tokens: capacity - 1, // Trừ luôn 1 token cho request hiện tại
        lastRefill: now,
      });
      return next();
    }
    for (let [k, v] of rateLimitMap) {
      console.log(`Key: ${k}, Tokens: ${(v.tokens).toFixed(2)}`);
    }
    // 3. Lấy thông tin user cũ
    const bucket = rateLimitMap.get(key);
    
    // 4. Tính toán lượng token được hồi (Refill)
    const elapsed = (now - bucket.lastRefill) / 1000; // Đổi ra giây
    const newTokens = bucket.tokens + (elapsed * refillRate);
    
    // Cập nhật token (không được vượt quá capacity)
    bucket.tokens = Math.min(capacity, newTokens);
    bucket.lastRefill = now;

    // 5. Kiểm tra xem có đủ token để đi tiếp không
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1; // Trừ 1 token
      return next();
    } else {
      // Hết token -> Chặn
      // Có thể thêm header để Client biết bao lâu nữa được thử lại
      const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate);
      res.set('Retry-After', retryAfter);
      
      return res.status(429).json({
        success: false,
        message: "Too Many Requests",
        retryAfterSeconds: retryAfter
      });
    }
  };
};
export default rateLimitMiddleware;